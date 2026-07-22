import { prisma } from '../lib/prisma'
import { redis } from '../lib/redis'
import { Decimal } from 'decimal.js'
import { verifyHMAC } from '../lib/crypto/hmac'
import { verifyRecaptchaServerSide } from '../lib/anti-cheat/recaptcha'
import { MultiAccountDetector } from '../lib/anti-cheat/multi-account'

const MAX_ROUND_DURATION_MINS = 5
const SUBMISSION_LOCK_PREFIX = 'lock:submission:'

export interface SubmitPayload {
  roundId: string
  exactTimestamp: string // e.g. "1735689600000.1234"
  clientNonce: string
  powSolution: string
  hmacSignature: string
  recaptchaToken: string
  deviceFingerprint: string
  userAgent: string
  behaviorHash?: string
}

export class RoundService {
  /**
   * Core logic for handling a user's time match submission.
   * Includes the 7-Layer Anti-Macro Defense validation.
   */
  public static async processSubmission(userId: string, payload: SubmitPayload): Promise<{ success: boolean; message: string; diff?: string }> {
    const { roundId, exactTimestamp, hmacSignature, clientNonce, recaptchaToken, deviceFingerprint, powSolution, userAgent } = payload
    
    // 1. Fetch Round
    const round = await prisma.round.findUnique({ where: { id: roundId } })
    if (!round) throw new Error('Round not found')
    if (round.status !== 'ACTIVE') throw new Error('Round is not currently active')

    const now = new Date()
    if (now > round.endsAt) throw new Error('Round has already ended')

    // 2. Prevent Double Submission using Redis Lock
    const lockKey = `${SUBMISSION_LOCK_PREFIX}${roundId}:${userId}`
    const hasSubmitted = await redis.setnx(lockKey, '1')
    if (hasSubmitted === 0) {
      throw new Error('You have already submitted for this round')
    }
    await redis.expire(lockKey, MAX_ROUND_DURATION_MINS * 60)

    // 3. Layer 3: HMAC Verification
    // Payload used for signature generation on client: `${roundId}:${userId}:${exactTimestamp}:${clientNonce}`
    const expectedPayload = `${roundId}:${userId}:${exactTimestamp}:${clientNonce}`
    if (!verifyHMAC(expectedPayload, hmacSignature)) {
      return { success: false, message: 'SECURITY_REJECTION: Invalid signature' }
    }

    // 4. Layer 5: reCAPTCHA v3
    const score = await verifyRecaptchaServerSide(recaptchaToken)
    if (score < 0.3) {
      // Very likely a bot. We log it but reject.
      await this.recordFailedSubmission(userId, roundId, 'LOW_RECAPTCHA_SCORE')
      return { success: false, message: 'SECURITY_REJECTION: Automated behavior detected' }
    }

    // 5. Layer 6: Multi-Account Detection
    await MultiAccountDetector.logDeviceFingerprint(userId, deviceFingerprint, userAgent)
    const isMultiAccount = await MultiAccountDetector.isExcessiveAccountsOnDevice(deviceFingerprint)
    if (isMultiAccount) {
      return { success: false, message: 'SECURITY_REJECTION: Too many accounts on this device' }
    }

    // 6. Calculate Time Difference (Precision to 0.1ms = 4 decimal places)
    const target = new Decimal(round.targetTime.toString())
    const submitted = new Decimal(exactTimestamp)
    const timeDiff = submitted.minus(target).abs()

    // 7. Save Submission
    await prisma.submission.create({
      data: {
        roundId,
        userId,
        exactTimestamp: submitted,
        timeDiff,
        hmacSignature,
        clientNonce,
        powSolution,
        recaptchaScore: score,
        deviceFingerprint,
        behaviorHash: payload.behaviorHash
      }
    })

    return { 
      success: true, 
      message: 'Submission accepted',
      diff: timeDiff.toFixed(4)
    }
  }

  private static async recordFailedSubmission(userId: string, roundId: string, reason: string) {
    // In a real scenario, increment a suspicious score on the User model
    await prisma.user.update({
      where: { id: userId },
      data: { suspiciousScore: { increment: 1 } }
    })
  }
}

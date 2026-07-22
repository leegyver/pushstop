import { redis } from '../lib/redis'
import crypto from 'crypto'
import { sendNaverSms } from '../lib/sms/naver-sens'
import { prisma } from '../lib/prisma'
import { generateBlindIndex } from '../lib/crypto/hmac'

const TTL_SECONDS = 180 // 3 minutes
const COOLDOWN_SECONDS = 60 // 1 minute
const MAX_ATTEMPTS = 5
const MAX_SENDS_PER_10MIN = 3
const MAX_ACCOUNTS_PER_PHONE = parseInt(process.env.MAX_ACCOUNTS_PER_PHONE || '3', 10)

export function generateOTP(): string {
  return crypto.randomInt(100000, 1000000).toString()
}

export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

export async function checkAccountLimit(phoneNumber: string): Promise<void> {
  const normalizedPhone = normalizePhoneNumber(phoneNumber)
  const count = await prisma.user.count({
    where: { phoneNumber: normalizedPhone }
  })
  
  if (count >= MAX_ACCOUNTS_PER_PHONE) {
    throw new Error(`ACCOUNT_LIMIT_EXCEEDED: 해당 전화번호로는 최대 ${MAX_ACCOUNTS_PER_PHONE}개의 계정만 생성할 수 있습니다.`)
  }
}

export async function sendVerificationCode(phoneNumber: string, ipAddress: string): Promise<string> {
  const normalizedPhone = normalizePhoneNumber(phoneNumber)
  
  if (!/^01[016789]\d{7,8}$/.test(normalizedPhone)) {
    throw new Error('INVALID_PHONE_NUMBER: 유효한 한국 휴대전화 번호 형식이 아닙니다.')
  }

  // 1. Account Limit Check
  await checkAccountLimit(normalizedPhone)

  const otpKey = `otp:phone:${normalizedPhone}`
  const cooldownKey = `otp:cooldown:phone:${normalizedPhone}`
  const rateLimitKeyPhone = `ratelimit:phone:${normalizedPhone}`
  const rateLimitKeyIp = `ratelimit:ip:${ipAddress}`

  // 2. Cooldown Check (1 minute)
  const inCooldown = await redis.exists(cooldownKey)
  if (inCooldown) {
    throw new Error('COOLDOWN_ACTIVE: 60초 후에 다시 시도해주세요.')
  }

  // 3. Rate Limit Check (Max 3 per 10 mins per phone)
  const phoneSendCount = await redis.incr(rateLimitKeyPhone)
  if (phoneSendCount === 1) await redis.expire(rateLimitKeyPhone, 600)
  if (phoneSendCount > MAX_SENDS_PER_10MIN) {
    throw new Error('RATE_LIMIT_EXCEEDED: 너무 많은 요청이 발생했습니다. 10분 후에 다시 시도해주세요.')
  }

  // 4. Rate Limit Check (Max 10 per 10 mins per IP to prevent pumping)
  const ipSendCount = await redis.incr(rateLimitKeyIp)
  if (ipSendCount === 1) await redis.expire(rateLimitKeyIp, 600)
  if (ipSendCount > 10) {
    throw new Error('RATE_LIMIT_EXCEEDED: 해당 IP에서 너무 많은 요청이 발생했습니다.')
  }

  // 5. Generate and Store OTP
  const code = generateOTP()
  await redis.hmset(otpKey, { code, attempts: '0' })
  await redis.expire(otpKey, TTL_SECONDS)

  // 6. Set Cooldown
  await redis.set(cooldownKey, '1', 'EX', COOLDOWN_SECONDS)

  // 7. Send SMS via Naver SENS
  if (process.env.NODE_ENV !== 'development') {
    await sendNaverSms(normalizedPhone, code)
  } else {
    console.log(`[DEV MODE] SMS Code for ${normalizedPhone}: ${code}`)
  }

  return code
}

export async function verifyCode(userId: string, phoneNumber: string, inputCode: string): Promise<boolean> {
  const normalizedPhone = normalizePhoneNumber(phoneNumber)
  const otpKey = `otp:phone:${normalizedPhone}`

  const data = await redis.hgetall(otpKey)

  if (!data || !data.code) {
    throw new Error('EXPIRED_OR_INVALID: 인증 코드가 만료되었거나 존재하지 않습니다.')
  }

  let attempts = parseInt(data.attempts || '0', 10)

  if (attempts >= MAX_ATTEMPTS) {
    await redis.del(otpKey)
    throw new Error('MAX_ATTEMPTS_EXCEEDED: 최대 인증 시도 횟수를 초과했습니다. 새로운 코드를 요청해주세요.')
  }

  if (data.code !== inputCode.trim()) {
    attempts += 1
    if (attempts >= MAX_ATTEMPTS) {
      await redis.del(otpKey)
      throw new Error('MAX_ATTEMPTS_EXCEEDED: 최대 인증 시도 횟수를 초과했습니다. 새로운 코드를 요청해주세요.')
    } else {
      await redis.hset(otpKey, 'attempts', attempts.toString())
      const remaining = MAX_ATTEMPTS - attempts
      throw new Error(`INVALID_CODE: 인증 코드가 일치하지 않습니다. (남은 시도: ${remaining}회)`)
    }
  }

  // Double check account limit right before verifying
  await checkAccountLimit(normalizedPhone)

  // Code is correct, update DB
  await prisma.user.update({
    where: { id: userId },
    data: {
      phoneNumber: normalizedPhone,
      isVerified: true
    }
  })

  // Clean up Redis
  await redis.del(otpKey)
  
  return true
}

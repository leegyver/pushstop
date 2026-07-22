import { prisma } from '../prisma'

export class MultiAccountDetector {
  /**
   * Check if a specific device fingerprint is associated with an excessive number of accounts.
   */
  public static async isExcessiveAccountsOnDevice(fingerprint: string, limit: number = 3): Promise<boolean> {
    const count = await prisma.deviceFingerprint.count({
      where: { fingerprint }
    })
    return count > limit
  }

  /**
   * Log a device fingerprint for a user.
   */
  public static async logDeviceFingerprint(userId: string, fingerprint: string, userAgent: string): Promise<void> {
    await prisma.deviceFingerprint.upsert({
      where: {
        userId_fingerprint: {
          userId,
          fingerprint
        }
      },
      update: {
        lastSeenAt: new Date(),
        userAgent
      },
      create: {
        userId,
        fingerprint,
        userAgent
      }
    })
  }
}

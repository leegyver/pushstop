import { prisma } from '../lib/prisma'
import { SessionPayload, signToken } from '../lib/crypto/jwt'

interface OAuthProfile {
  provider: 'google' | 'kakao' | 'naver'
  providerId: string
  nickname: string
  profileImage?: string
  email?: string // Note: We don't verify this email for anti-cheat, it's just from the provider
}

export class AuthService {
  /**
   * Handle login or registration via OAuth.
   * Returns a JWT session token.
   */
  public static async handleOAuthLogin(profile: OAuthProfile): Promise<string> {
    const { provider, providerId, nickname, profileImage } = profile

    // 1. Find existing user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: provider === 'google' ? providerId : undefined },
          { kakaoId: provider === 'kakao' ? providerId : undefined },
          { naverId: provider === 'naver' ? providerId : undefined }
        ]
      }
    })

    // 2. Create if not exists
    if (!user) {
      user = await prisma.user.create({
        data: {
          nickname: this.generateUniqueNickname(nickname),
          profileImage,
          googleId: provider === 'google' ? providerId : null,
          kakaoId: provider === 'kakao' ? providerId : null,
          naverId: provider === 'naver' ? providerId : null,
        }
      })
    } else {
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })
    }

    if (user.isBanned) {
      throw new Error('ACCOUNT_BANNED: 이 계정은 이용이 정지되었습니다.')
    }

    // 3. Issue Token
    const payload: SessionPayload = {
      userId: user.id,
      role: user.role,
      isVerified: user.isVerified
    }

    return await signToken(payload)
  }

  private static generateUniqueNickname(base: string): string {
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${base}#${randomSuffix}`
  }
}

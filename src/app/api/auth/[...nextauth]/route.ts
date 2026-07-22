import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import KakaoProvider from "next-auth/providers/kakao"
import NaverProvider from "next-auth/providers/naver"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock",
    }),
    // @ts-ignore - NextAuth KakaoProvider types incorrectly require clientSecret even when auth method is "none"
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID || "mock",
      client: {
        token_endpoint_auth_method: "none"
      }
    }),
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID || "mock",
      clientSecret: process.env.NAVER_CLIENT_SECRET || "mock",
    })
  ],
  callbacks: {
    async session({ session, user }: { session: any; user: any }) {
      if (session.user) {
        session.user.id = user.id
        // Add custom fields
        session.user.nickname = user.nickname
        session.user.role = user.role
        session.user.balance = user.balance
        session.user.isVerified = user.isVerified
      }
      return session
    }
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: "database" as const,
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

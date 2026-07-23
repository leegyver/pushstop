import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    // 1. Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        nickname: true,
        balance: true,
        isVerified: true,
        createdAt: true,
        image: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 2. Get game statistics
    // Average timeDiff and total games played
    const statsResult = await prisma.submission.aggregate({
      where: { userId },
      _avg: { timeDiff: true },
      _count: { id: true }
    })

    const totalGames = statsResult._count.id
    const avgTimeDiff = statsResult._avg.timeDiff ? Number(statsResult._avg.timeDiff) : 0

    // 3. Get recent point logs (last 20)
    const pointLogs = await prisma.pointLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json({
      user,
      stats: {
        totalGames,
        avgTimeDiff,
      },
      pointLogs
    })
  } catch (error: any) {
    console.error("Profile API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

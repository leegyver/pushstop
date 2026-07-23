import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { nickname } = await req.json()
    const userId = (session.user as any).id

    if (!nickname || nickname.trim().length < 2 || nickname.trim().length > 12) {
      return NextResponse.json({ error: "닉네임은 2~12자 사이여야 합니다." }, { status: 400 })
    }

    const trimmedNickname = nickname.trim()

    // 1. Check for duplicates
    const existingUser = await prisma.user.findFirst({
      where: {
        nickname: trimmedNickname,
        id: { not: userId } // Exclude self
      }
    })

    if (existingUser) {
      return NextResponse.json({ error: "이미 사용 중인 닉네임입니다." }, { status: 409 })
    }

    // 2. Update nickname
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { nickname: trimmedNickname },
      select: { id: true, nickname: true }
    })

    return NextResponse.json({ success: true, nickname: updatedUser.nickname })
  } catch (error: any) {
    console.error("Nickname Update API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

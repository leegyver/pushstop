import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { GAME_CONSTANTS, getCurrentRound } from "@/lib/gameEngine"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = (session.user as any).id

    const body = await req.json()
    const { exactTimestamp, hmacSignature, clientNonce } = body

    if (!exactTimestamp) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    // 1. 현재 라운드 가져오기
    const round = await getCurrentRound()
    if (!round || round.status !== "ACTIVE") {
      return NextResponse.json({ error: "현재 진행 중인 게임이 없습니다." }, { status: 400 })
    }

    // 2. 이미 참여했는지 확인
    const existingSubmission = await prisma.submission.findFirst({
      where: { roundId: round.id, userId }
    })
    if (existingSubmission) {
      return NextResponse.json({ error: "이번 라운드에 이미 참여하셨습니다." }, { status: 400 })
    }

    // 3. 유저 잔고 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true }
    })
    if (!user || user.balance < GAME_CONSTANTS.PARTICIPATION_FEE) {
      return NextResponse.json({ error: "포인트가 부족하여 게임에 참여할 수 없습니다. (100P 필요)" }, { status: 400 })
    }

    // 4. 서버 측 검증 및 계산
    // 서버 도착 시간(serverReceivedAt)
    const serverReceivedAt = new Date()
    
    // 네트워크 핑이나 브라우저-서버 시계 불일치가 있을 수 있지만
    // 1/10000초 정밀도를 위해 클라이언트가 보낸 exactTimestamp를 일단 신뢰함.
    // 단, 서버도착시간과 너무 큰 차이(예: 3초 이상)가 나면 조작으로 간주하고 거절
    if (Math.abs(serverReceivedAt.getTime() - exactTimestamp) > 3000) {
      return NextResponse.json({ error: "비정상적인 시간이 감지되었습니다." }, { status: 400 })
    }

    const targetTimeMs = Number(round.targetTime)
    const exactMs = Number(exactTimestamp)
    
    // 타임스탬프 계산 (목표 시간과의 오차 절대값)
    const timeDiff = Math.abs(exactMs - targetTimeMs)
    // 이른 체크 여부 판정
    const isEarly = exactMs < targetTimeMs

    // TODO: hmacSignature 검증 (보안)

    // 5. 트랜잭션으로 처리 (포인트 차감, 팟 증가, 제출 생성)
    const result = await prisma.$transaction(async (tx) => {
      // 포인트 차감
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: GAME_CONSTANTS.PARTICIPATION_FEE } }
      })

      // 로그 기록 (선택) - 게임 참여비 차감
      await tx.pointLog.create({
        data: {
          userId,
          amount: -GAME_CONSTANTS.PARTICIPATION_FEE,
          previousBalance: user.balance,
          newBalance: updatedUser.balance,
          type: "GAME_WIN", // 참여 차감도 묶기 (enum 타입 확장을 안했다면 임시로 매핑)
          referenceId: round.id,
          description: "게임 참여 비용 차감"
        }
      })

      // 총 팟 증가
      await tx.round.update({
        where: { id: round.id },
        data: { totalPotPoints: { increment: GAME_CONSTANTS.PARTICIPATION_FEE } }
      })

      // 제출 기록
      const submission = await tx.submission.create({
        data: {
          roundId: round.id,
          userId,
          exactTimestamp,
          timeDiff,
          isEarly,
          hmacSignature: hmacSignature || "none",
          clientNonce: clientNonce || "none",
          serverReceivedAt
        }
      })

      return { submission, newBalance: updatedUser.balance }
    })

    return NextResponse.json({ 
      success: true, 
      submission: result.submission,
      newBalance: result.newBalance
    })

  } catch (error) {
    console.error("Game Submit Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

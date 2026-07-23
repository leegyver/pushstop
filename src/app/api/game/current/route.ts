import { NextResponse } from "next/server"
import { getCurrentRound, checkAndActivateRounds } from "@/lib/gameEngine"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // 1. 상태 전이 및 현재 라운드 가져오기
    const round = await getCurrentRound()

    if (!round) {
      return NextResponse.json({ error: "Failed to get round" }, { status: 500 })
    }

    // 2. 만약 WAITING이나 ENDED 상태의 라운드라면 (결과 대기 시간 중), 결과 데이터를 함께 내려보냄
    if (round.status === "WAITING" || round.status === "ENDED") {
      // 최근에 끝난 라운드 검색
      const endedRound = await prisma.round.findFirst({
        where: { status: "ENDED" },
        orderBy: { startsAt: "desc" },
        include: {
          submissions: {
            orderBy: [
              { isUnique: "desc" }, // unique한게 먼저 오도록 정렬? (false면 뒤로 빠지게 할 수도 있지만, timeDiff가 중요함)
              { timeDiff: "asc" }
            ],
            take: 20, // 상위 20명
            include: {
              user: { select: { nickname: true, name: true } }
            }
          }
        }
      })

      // 프론트엔드에서 보여줄 때:
      // isUnique === false 인 사람들은 순위(메달)에서 제외됨
      
      return NextResponse.json({
        success: true,
        round: round, // WAITING 중인 새 라운드 정보 (언제 시작하는지 표시 위함)
        endedRound: endedRound // 방금 끝난 게임 결과
      })
    }

    // ACTIVE 상태라면 라운드 정보만 리턴
    return NextResponse.json({ success: true, round })

  } catch (error) {
    console.error("GET /api/game/current Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

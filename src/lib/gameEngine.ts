import { prisma } from "@/lib/prisma"

// 게임 설정 상수
export const GAME_CONSTANTS = {
  PARTICIPATION_FEE: 100, // 게임 참여 시 차감되는 포인트
  RESULT_DURATION_MS: 10 * 60 * 1000, // 결과 대기 시간: 10분
  TARGET_ALLOWANCE_MS: 1 * 60 * 1000, // 목표 시간 이후 게임이 열려있는 유예 시간 (1분)
  PRIZE_POOL_RATIO: {
    FIRST: 0.50,  // 1등 50%
    SECOND: 0.20, // 2등 20%
    THIRD: 0.10,  // 3등 10%
  }
}

// Lazy Evaluation: 현재 라운드 가져오기 및 자동 전환
export async function getCurrentRound() {
  await checkAndActivateRounds()

  let activeRound = await prisma.round.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { startsAt: "desc" }
  })

  const now = new Date()

  // 1. 진행 중인 라운드가 없으면 새로 생성
  if (!activeRound) {
    activeRound = await createNewRound()
    return activeRound
  }

  // 2. 진행 중인 라운드의 시간이 끝났다면 정산 처리 시작
  if (now > activeRound.endsAt) {
    // 다중 서버/요청 충돌 방지를 위해 상태 변경 트랜잭션 시도
    const updated = await prisma.round.updateMany({
      where: { id: activeRound.id, status: "ACTIVE" },
      data: { status: "CALCULATING" }
    })

    if (updated.count > 0) {
      // 정산 백그라운드 처리 (기다리지 않음 - Vercel 서버리스일 경우 주의 필요하나 현재 PM2 환경이므로 가능)
      // 안정성을 위해 await를 걸 수도 있으나 응답 지연을 막기 위해 래핑
      await calculateRoundResults(activeRound.id).catch(console.error)
    }

    // 새 라운드가 아직 ACTIVE가 아니므로, 생성 로직을 여기서 동기적으로 처리하거나
    // 가장 최근의 WAITING/ENDED/CALCULATING 상태를 체크
    
    // 계산이 바로 끝났다고 가정하거나 방금 생성된 새 라운드를 가져오기
    let newRound = await prisma.round.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { startsAt: "desc" }
    })
    
    if (!newRound) {
       // 결과창 대기시간 (10분)을 위한 가상의 라운드 상태 반환
       // 클라이언트가 이 상태를 보고 "결과 정산중/결과 표시중" 인지 파악
       return await prisma.round.findUnique({ where: { id: activeRound.id } })
    }
    
    return newRound
  }

  return activeRound
}

async function createNewRound() {
  const now = new Date()
  
  // 첫 라운드(또는 수동 시작)는 현재 시간으로부터 30분 뒤를 타겟으로 설정
  const targetOffset = 30 * 60 * 1000
  const targetTime = now.getTime() + targetOffset
  
  // 게임 종료 시간은 타겟 시간 이후 1분(유예 시간) 뒤
  const endsAt = new Date(targetTime + GAME_CONSTANTS.TARGET_ALLOWANCE_MS)

  return await prisma.round.create({
    data: {
      targetTime: targetTime, // Absolute Timestamp
      status: "ACTIVE",
      totalPotPoints: 0,
      startsAt: now,
      endsAt: endsAt,
      nextRoundDelay: GAME_CONSTANTS.RESULT_DURATION_MS / 1000
    }
  })
}

export async function calculateRoundResults(roundId: string) {
  // 1. 라운드 정보와 제출 기록 가져오기
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: { submissions: true }
  })

  if (!round || round.status !== "CALCULATING") return

  const submissions = round.submissions

  // 2. 동점자(isUnique) 처리
  // timeDiff 값을 기준으로 그룹핑
  const diffGroups: Record<string, string[]> = {}
  for (const sub of submissions) {
    const diffKey = sub.timeDiff.toString()
    if (!diffGroups[diffKey]) diffGroups[diffKey] = []
    diffGroups[diffKey].push(sub.id)
  }

  // 그룹 크기가 1보다 크면 isUnique = false 처리
  const nonUniqueIds: string[] = []
  for (const diffKey in diffGroups) {
    if (diffGroups[diffKey].length > 1) {
      nonUniqueIds.push(...diffGroups[diffKey])
    }
  }

  // DB 업데이트 (동점자 마킹)
  if (nonUniqueIds.length > 0) {
    await prisma.submission.updateMany({
      where: { id: { in: nonUniqueIds } },
      data: { isUnique: false }
    })
  }

  // 3. 수상자(1,2,3위) 선정 (isUnique == true && isEarly == false 인 유저 중 timeDiff 가 제일 작은 순)
  const eligibleSubmissions = submissions
    .filter(s => !nonUniqueIds.includes(s.id) && !s.isEarly)
    .sort((a, b) => Number(a.timeDiff) - Number(b.timeDiff))

  const totalPot = round.totalPotPoints
  const prizes = [
    Math.floor(totalPot * GAME_CONSTANTS.PRIZE_POOL_RATIO.FIRST),
    Math.floor(totalPot * GAME_CONSTANTS.PRIZE_POOL_RATIO.SECOND),
    Math.floor(totalPot * GAME_CONSTANTS.PRIZE_POOL_RATIO.THIRD),
  ]

  // 트랜잭션으로 포인트 지급 및 상태 업데이트
  await prisma.$transaction(async (tx) => {
    // 순위 마킹 및 포인트 지급
    for (let i = 0; i < 3; i++) {
      const winnerSub = eligibleSubmissions[i]
      if (winnerSub) {
        const prizeAmount = prizes[i]
        
        // 제출 기록에 순위 마킹
        await tx.submission.update({
          where: { id: winnerSub.id },
          data: { rank: i + 1 }
        })

        if (prizeAmount > 0) {
          // 유저 잔고 조회
          const user = await tx.user.findUnique({ where: { id: winnerSub.userId } })
          if (user) {
            // 잔고 증가
            const updatedUser = await tx.user.update({
              where: { id: user.id },
              data: { balance: { increment: prizeAmount } }
            })
            // 로그 작성
            await tx.pointLog.create({
              data: {
                userId: user.id,
                amount: prizeAmount,
                previousBalance: user.balance,
                newBalance: updatedUser.balance,
                type: "GAME_WIN",
                referenceId: round.id,
                description: `Push Stop ${i + 1}위 당첨 상금 (총 팟: ${totalPot}P)`
              }
            })
          }
        }
      }
    }

    // 정산 완료 처리
    await tx.round.update({
      where: { id: round.id },
      data: { status: "ENDED" }
    })
  })

  // 4. 다음 라운드 스케줄링 (지금으로부터 결과 노출 10분 뒤 시작)
  const now = new Date()
  const nextStartsAt = new Date(now.getTime() + GAME_CONSTANTS.RESULT_DURATION_MS)

  // 미래 시간에 예약된 상태(WAITING)로 생성
  // 하지만 Lazy Evaluation 방식에서는 현재 시간이 nextStartsAt을 지나면 ACTIVE로 처리할 로직이 필요함.
  // 로직 간소화를 위해, 현재 게임이 끝난 즉시 새 라운드를 만들되 startsAt을 10분 뒤로 세팅
  
  // 다음 라운드 스케줄링시 "20분 내외(18분~22분)" 랜덤 타겟 설정
  const minTargetOffset = 18 * 60 * 1000
  const maxTargetOffset = 22 * 60 * 1000
  const randomOffset = Math.floor(Math.random() * (maxTargetOffset - minTargetOffset)) + minTargetOffset
  const nextTargetTime = nextStartsAt.getTime() + randomOffset

  // 게임 종료 시간은 타겟 시간 이후 1분 뒤
  const nextEndsAt = new Date(nextTargetTime + GAME_CONSTANTS.TARGET_ALLOWANCE_MS)

  await prisma.round.create({
    data: {
      targetTime: nextTargetTime,
      status: "WAITING", 
      totalPotPoints: 0,
      startsAt: nextStartsAt,
      endsAt: nextEndsAt,
      nextRoundDelay: GAME_CONSTANTS.RESULT_DURATION_MS / 1000
    }
  })
}

// WAITING -> ACTIVE 자동 전환 처리 함수 (getCurrentRound 에 병합용)
export async function checkAndActivateRounds() {
  const now = new Date()
  
  // 시작 시간이 지났는데 아직 WAITING 인 라운드들을 ACTIVE로 변경
  await prisma.round.updateMany({
    where: { 
      status: "WAITING",
      startsAt: { lte: now }
    },
    data: { status: "ACTIVE" }
  })
}

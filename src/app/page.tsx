"use client"
import { Navbar } from "@/components/ui/Navbar"
import { GameTimer } from "@/components/game/GameTimer"
import { StopButton } from "@/components/game/StopButton"
import { motion } from "framer-motion"
import { useSession, signIn } from "next-auth/react"
import { useEffect, useState, useRef } from "react"
import { Coins, Trophy, Clock, AlertCircle } from "lucide-react"

export default function Home() {
  const { data: session, status } = useSession()
  const [roundState, setRoundState] = useState<any>(null)
  const [endedData, setEndedData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [submitResult, setSubmitResult] = useState<string | null>(null)
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0)

  // Timer logic for client-side syncing
  const [timeLeft, setTimeLeft] = useState<number>(0)
  
  useEffect(() => {
    fetchRoundStatus()
    const interval = setInterval(fetchRoundStatus, 5000) // Poll every 5s
    return () => clearInterval(interval)
  }, [])

  const fetchRoundStatus = async () => {
    try {
      const res = await fetch("/api/game/current")
      const data = await res.json()
      if (data.success) {
        if (data.serverTime) {
          setServerTimeOffset(data.serverTime - Date.now())
        }
        setRoundState(data.round)
        if (data.endedRound) {
          setEndedData(data.endedRound)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Update countdown
  useEffect(() => {
    if (!roundState) return
    const endsAt = new Date(roundState.endsAt).getTime()
    const startsAt = new Date(roundState.startsAt).getTime()

    const updateTimer = () => {
      const now = Date.now()
      if (roundState.status === "ACTIVE") {
        setTimeLeft(Math.max(0, endsAt - now))
      } else if (roundState.status === "WAITING") {
        setTimeLeft(Math.max(0, startsAt - now))
      }
    }
    
    updateTimer()
    const timerId = setInterval(updateTimer, 1000)
    return () => clearInterval(timerId)
  }, [roundState])

  const formatTimeLeft = (ms: number) => {
    const totalSec = Math.floor(ms / 1000)
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0')
    const s = (totalSec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleStop = async (exactTimestamp: number) => {
    if (!session) {
      alert("로그인이 필요합니다!")
      return
    }
    try {
      setHasSubmitted(true) // Disable button immediately
      const res = await fetch("/api/game/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          // 클라이언트의 절대시간 (로컬시간 + 오프셋)
          exactTimestamp: exactTimestamp, 
          hmacSignature: "test", 
          clientNonce: "test" 
        })
      })
      const data = await res.json()
      if (data.success) {
        const diff = data.submission.timeDiff
        const isEarly = data.submission.isEarly
        if (isEarly) {
          setSubmitResult(`[조기 탈락] 목표 시간보다 ${(diff / 1000).toFixed(4)}초 일찍 누르셨습니다. 😭`)
        } else {
          setSubmitResult(`기록이 제출되었습니다! (목표 시간 대비 +${(diff / 1000).toFixed(4)}초)`)
        }
        fetchRoundStatus() // Update pot size
      } else {
        setHasSubmitted(false)
        alert(data.error)
      }
    } catch (e) {
      setHasSubmitted(false)
      alert("네트워크 에러가 발생했습니다.")
    }
  }

  const renderActiveState = () => (
    <div className="w-full flex flex-col items-center">
      {/* 팟 사이즈 표시 */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8 px-8 py-4 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 rounded-3xl flex flex-col items-center"
      >
        <div className="text-[var(--text-secondary)] text-sm font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" /> 총 상금(Pot)
        </div>
        <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
          {(roundState?.totalPotPoints || 0).toLocaleString()} <span className="text-2xl">P</span>
        </div>
        <div className="text-xs text-[var(--text-secondary)] mt-2 bg-black/40 px-3 py-1 rounded-full">
          1회 참여 시 100P 차감
        </div>
      </motion.div>

      <div className="text-[var(--accent-primary)] font-bold text-xl mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" /> 진행 종료까지 {formatTimeLeft(timeLeft)}
      </div>

      <GameTimer 
        targetTimeMs={Number(roundState?.targetTime || 0)} 
        serverTimeOffset={serverTimeOffset}
        onStop={handleStop} 
        disabled={hasSubmitted || status === "unauthenticated"} 
      />
      
      {hasSubmitted && submitResult && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-lg font-bold text-green-400 bg-green-500/10 px-6 py-3 rounded-2xl border border-green-500/20">
          {submitResult}
          <div className="text-sm text-[var(--text-secondary)] mt-1 font-normal">결과 발표를 기다려주세요!</div>
        </motion.div>
      )}

      {status !== "loading" && !session && (
        <div className="mt-12 w-full max-w-md glass-panel p-8 rounded-3xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">지금 시작하기</h2>
            <p className="text-sm text-[var(--text-secondary)]">SNS 계정으로 가입하면 100P 지급!</p>
          </div>
          
          <div className="space-y-3">
            <button onClick={() => signIn('google')} className="flex items-center justify-center gap-3 w-full bg-white text-black py-4 rounded-2xl font-bold hover:scale-[1.02] transition-transform">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google 계정으로 시작
            </button>
            <button onClick={() => signIn('kakao')} className="flex items-center justify-center gap-3 w-full bg-[#FEE500] text-black py-4 rounded-2xl font-bold hover:scale-[1.02] transition-transform">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3c-5.5 0-10 3.5-10 7.8 0 2.8 1.8 5.2 4.4 6.6-.2 1.4-.9 4.3-.9 4.5 0 .2.2.3.4.1.1 0 5-3.4 7-4.7 6.1-.2 10.1-3.6 10.1-6.5C22 6.5 17.5 3 12 3z"/></svg>
              카카오톡으로 시작
            </button>
            <button onClick={() => signIn('naver')} className="flex items-center justify-center gap-3 w-full bg-[#03C75A] text-white py-4 rounded-2xl font-bold hover:scale-[1.02] transition-transform">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/></svg>
              네이버로 시작
            </button>
          </div>
        </div>
      )}
    </div>
  )

  const renderLeaderboard = () => {
    if (!endedData || !endedData.submissions) return null

    // 딤드처리된 조기 클릭자 목록과 정상 랭킹을 분리
    const earlyOuts = endedData.submissions.filter((s: any) => s.isEarly).slice(0, 10)
    const validRanks = endedData.submissions.filter((s: any) => !s.isEarly)

    return (
      <div className="w-full max-w-4xl mx-auto mt-8 flex flex-col gap-6">
        {/* Valid Ranks Table */}
        <div className="glass-panel p-6 rounded-3xl">
          <h3 className="text-2xl font-black text-white flex items-center gap-3 mb-6">
            <Trophy className="text-yellow-400" /> 이전 라운드 순위 (상위 20명)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[var(--text-secondary)]">
                  <th className="p-4 font-bold">순위</th>
                  <th className="p-4 font-bold">닉네임</th>
                  <th className="p-4 font-bold">체크 기록 (목표 대비)</th>
                  <th className="p-4 font-bold">상태</th>
                </tr>
              </thead>
              <tbody>
                {validRanks.map((sub: any) => {
                  const isMedal = sub.isUnique && sub.rank && sub.rank <= 3
                  let rankStr = "-"
                  let rowClass = "border-b border-white/5 hover:bg-white/5 transition-colors"
                  
                  if (isMedal) {
                    if (sub.rank === 1) rankStr = "🥇 1위"
                    else if (sub.rank === 2) rankStr = "🥈 2위"
                    else if (sub.rank === 3) rankStr = "🥉 3위"
                    rowClass = "border-b border-white/10 bg-yellow-500/10"
                  } else if (!sub.isUnique) {
                    rowClass = "border-b border-white/5 opacity-50 bg-red-500/5"
                    rankStr = "탈락"
                  } else {
                    rankStr = sub.rank ? `${sub.rank}위` : "-"
                  }

                  return (
                    <tr key={sub.id} className={rowClass}>
                      <td className="p-4 font-bold text-white">{rankStr}</td>
                      <td className="p-4">{sub.user?.nickname || "알 수 없음"}</td>
                      <td className="p-4 font-mono text-[var(--accent-primary)] font-bold">
                        +{ (Number(sub.timeDiff) / 1000).toFixed(4) }초
                      </td>
                      <td className="p-4">
                        {!sub.isUnique ? (
                          <span className="flex items-center gap-1 text-red-400 text-xs font-bold bg-red-500/20 px-2 py-1 rounded-full w-max">
                            <AlertCircle className="w-3 h-3" /> 동점자 탈락
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-secondary)] font-bold text-green-400">정상 통과</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {validRanks.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-[var(--text-secondary)]">정상 참여자가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Early Outs List (Dimmed) */}
        {earlyOuts.length > 0 && (
          <div className="glass-panel p-6 rounded-3xl opacity-60 grayscale-[50%] hover:grayscale-0 hover:opacity-100 transition-all">
            <h3 className="text-xl font-bold text-[var(--text-secondary)] flex items-center gap-2 mb-4">
              <AlertCircle className="text-red-500 w-5 h-5" /> 조기 클릭 탈락자 (아웃)
            </h3>
            <div className="flex flex-wrap gap-3">
              {earlyOuts.map((sub: any) => (
                <div key={sub.id} className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
                  <span className="font-bold text-white/70">{sub.user?.nickname || "알 수 없음"}</span>
                  <span className="font-mono text-red-400 text-sm">
                    -{ (Number(sub.timeDiff) / 1000).toFixed(4) }초
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderWaitingState = () => (
    <div className="w-full flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">결과 확인 및 대기 중</h2>
        <div className="text-[var(--accent-primary)] text-6xl font-black tabular-nums font-mono drop-shadow-[0_0_20px_rgba(255,107,0,0.5)]">
          {formatTimeLeft(timeLeft)}
        </div>
        <p className="text-[var(--text-secondary)] mt-4">잠시 후 다음 라운드가 시작됩니다!</p>
      </motion.div>
      {renderLeaderboard()}
    </div>
  )

  const renderCalculatingState = () => (
    <div className="w-full flex flex-col items-center py-24">
       <div className="w-16 h-16 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mb-6"></div>
       <h2 className="text-2xl font-bold text-white">결과를 집계하고 있습니다...</h2>
    </div>
  )

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--bg-gradient-start)] blur-[128px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--bg-gradient-mid)] blur-[128px] rounded-full pointer-events-none" />
      
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center pt-32 pb-20 px-6 z-10 w-full max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 mb-12"
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tight text-gradient drop-shadow-lg">
            PUSH STOP
          </h1>
          <p className="text-[var(--text-secondary)] text-lg md:text-xl max-w-2xl mx-auto font-medium">
            1/10,000초 정밀 시계. 목표 시간에 가장 가깝게, 하지만 <span className="text-red-400 font-bold">먼저 누르면 즉시 탈락</span>합니다. 심리전에서 승리해 팟을 독식하세요!
          </p>
        </motion.div>

        {loading ? (
          <div className="py-20"><div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div></div>
        ) : (
          <>
            {(!roundState || roundState.status === "ACTIVE") && renderActiveState()}
            {(roundState?.status === "WAITING" || roundState?.status === "ENDED") && renderWaitingState()}
            {roundState?.status === "CALCULATING" && renderCalculatingState()}
          </>
        )}
      </main>
    </div>
  )
}

"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { User, ShieldCheck, Trophy, Activity, History, ArrowRight, Loader2, Coins, Pencil, X } from "lucide-react"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Edit Nickname State
  const [isEditingNickname, setIsEditingNickname] = useState(false)
  const [newNickname, setNewNickname] = useState("")
  const [editError, setEditError] = useState("")
  const [editLoading, setEditLoading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    } else if (status === "authenticated") {
      fetchProfileData()
    }
  }, [status, router])

  const fetchProfileData = async () => {
    try {
      const res = await fetch("/api/profile")
      const data = await res.json()
      if (res.ok) {
        setProfileData(data)
      }
    } catch (error) {
      console.error("Failed to fetch profile", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateNickname = async () => {
    if (newNickname.trim().length < 2 || newNickname.trim().length > 12) {
      setEditError("닉네임은 2~12자 사이여야 합니다.")
      return
    }
    setEditLoading(true)
    setEditError("")
    try {
      const res = await fetch("/api/profile/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: newNickname })
      })
      const data = await res.json()
      if (res.ok) {
        setProfileData({ ...profileData, user: { ...profileData.user, nickname: data.nickname } })
        setIsEditingNickname(false)
      } else {
        setEditError(data.error || "닉네임 변경에 실패했습니다.")
      }
    } catch (error) {
      setEditError("네트워크 오류가 발생했습니다.")
    } finally {
      setEditLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[var(--accent-primary)] animate-spin" />
      </div>
    )
  }

  if (!profileData) return null

  const { user, stats, pointLogs } = profileData

  return (
    <div className="max-w-6xl mx-auto px-4 pt-32 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Left Column: User Card & Stats */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          {/* User Card */}
          <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[var(--accent-primary)]/20 to-transparent"></div>
            
            <div className="w-24 h-24 rounded-full bg-black/50 border-4 border-[var(--accent-primary)] mb-4 relative z-10 flex items-center justify-center overflow-hidden">
              {user.image ? (
                <img src={user.image} alt={user.nickname || "User"} className="w-full h-full object-cover" />
              ) : (
                <img src="/default-avatar.svg" alt="Default Profile" className="w-full h-full object-cover" />
              )}
            </div>
            
            <div className="relative z-10 flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-white">
                {user.nickname || user.name || "Unknown User"}
              </h1>
              <button 
                onClick={() => {
                  setNewNickname(user.nickname || user.name || "")
                  setIsEditingNickname(true)
                }}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[var(--text-secondary)] hover:text-white transition-colors"
                title="닉네임 변경"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[var(--text-secondary)] text-sm mb-6 relative z-10">{user.email}</p>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm font-bold relative z-10">
              <ShieldCheck className="w-4 h-4" />
              {user.isVerified ? "휴대폰 인증 완료 (계정 보호 중)" : "미인증 계정"}
            </div>

            {/* Balance Widget */}
            <div className="w-full mt-8 p-6 bg-black/40 rounded-2xl border border-white/5 relative z-10 flex flex-col items-center">
              <span className="text-[var(--text-secondary)] text-sm font-bold uppercase tracking-wider mb-2">My Points</span>
              <div className="flex items-center gap-3 text-3xl font-black text-[var(--accent-primary)] drop-shadow-[0_0_10px_rgba(255,107,0,0.5)]">
                <Coins className="w-8 h-8" />
                {user.balance.toLocaleString()} P
              </div>
              <button 
                onClick={() => router.push('/shop')}
                className="mt-4 w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                상점 가기 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-[var(--accent-primary)]" />
              게임 통계
            </h2>
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                <span className="text-[var(--text-secondary)]">누적 참여 횟수</span>
                <span className="text-2xl font-black text-white">{stats.totalGames.toLocaleString()}회</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                <span className="text-[var(--text-secondary)]">평균 클릭 오차</span>
                <span className="text-2xl font-black text-[var(--accent-secondary)]">
                  {stats.avgTimeDiff > 0 ? `+${stats.avgTimeDiff.toFixed(3)}s` : "기록 없음"}
                </span>
              </div>
              <div className="flex justify-between items-end pb-2">
                <span className="text-[var(--text-secondary)]">획득 메달 수</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">0</span>
                  <Trophy className="w-5 h-5 text-yellow-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Point Logs */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-8 h-full flex flex-col">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-8">
              <History className="w-5 h-5 text-[var(--accent-primary)]" />
              최근 포인트 내역
            </h2>

            {pointLogs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)]">
                <History className="w-12 h-12 mb-4 opacity-20" />
                <p>아직 포인트 내역이 없습니다.</p>
                <p className="text-sm mt-2">게임에 참여하여 포인트를 획득해보세요!</p>
              </div>
            ) : (
              <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {pointLogs.map((log: any) => {
                  const isPositive = log.amount > 0
                  return (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            log.type === 'GAME_WIN' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            log.type === 'SHOP_PURCHASE' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            {log.type}
                          </span>
                          <span className="text-white text-sm font-medium">{log.description || '포인트 변동'}</span>
                        </div>
                        <span className="text-xs text-[var(--text-secondary)]">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-black ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}{log.amount.toLocaleString()} P
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] font-medium">
                          잔액: {log.newBalance.toLocaleString()} P
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Edit Nickname Modal */}
      {isEditingNickname && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
          >
            <button 
              onClick={() => setIsEditingNickname(false)}
              className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-4">닉네임 변경</h2>
            
            <div className="mb-4">
              <label className="block text-sm text-[var(--text-secondary)] mb-2">새 닉네임 (2~12자)</label>
              <input 
                type="text" 
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                maxLength={12}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                placeholder="새 닉네임 입력"
              />
              {editError && <p className="text-red-400 text-sm mt-2">{editError}</p>}
            </div>

            <button 
              onClick={handleUpdateNickname}
              disabled={editLoading || !newNickname.trim()}
              className="w-full py-3 bg-[var(--accent-primary)] text-white rounded-xl font-bold hover:bg-[var(--accent-secondary)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {editLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "저장하기"}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}

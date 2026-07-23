"use client"
import { motion } from "framer-motion"
import { Gift, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ShopPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen pt-32 px-4 flex flex-col items-center">
      <button 
        onClick={() => router.back()}
        className="self-start ml-4 md:ml-20 mb-8 flex items-center gap-2 text-[var(--text-secondary)] hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" /> 돌아가기
      </button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-3xl p-12 flex flex-col items-center text-center max-w-2xl w-full"
      >
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/30 rounded-full flex items-center justify-center mb-6">
          <Gift className="w-12 h-12 text-blue-400" />
        </div>
        <h1 className="text-3xl font-black text-white mb-4">포인트 교환 상점</h1>
        <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
          열심히 획득한 포인트를 문화상품권, 구글플레이 기프트카드 등으로<br />
          교환할 수 있는 상점이 곧 오픈될 예정입니다.
        </p>
        <div className="px-6 py-3 bg-white/5 rounded-full border border-white/10 text-sm font-bold text-[var(--accent-secondary)]">
          🚧 Step 4 개발 단계에서 오픈됩니다.
        </div>
      </motion.div>
    </div>
  )
}

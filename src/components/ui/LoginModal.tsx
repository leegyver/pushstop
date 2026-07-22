"use client"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { signIn } from "next-auth/react"

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md glass-panel p-8 rounded-3xl overflow-hidden"
          >
            <div className="absolute top-4 right-4">
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Push Stop 시작하기</h2>
              <p className="text-[var(--text-secondary)] text-sm">3초만에 간편하게 로그인하고 상금을 획득하세요.</p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => signIn('google')}
                className="w-full py-3 px-4 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                구글로 시작하기
              </button>
              <button
                onClick={() => signIn('kakao')}
                className="w-full py-3 px-4 bg-[#FEE500] text-black font-semibold rounded-xl flex items-center justify-center gap-3 hover:bg-[#FEE500]/90 transition-colors"
              >
                카카오로 시작하기
              </button>
              <button
                onClick={() => signIn('naver')}
                className="w-full py-3 px-4 bg-[#03C75A] text-white font-semibold rounded-xl flex items-center justify-center gap-3 hover:bg-[#03C75A]/90 transition-colors"
              >
                네이버로 시작하기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

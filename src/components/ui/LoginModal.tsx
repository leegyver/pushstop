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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
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

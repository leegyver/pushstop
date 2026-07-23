"use client"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Monitor, Moon, Sun, Snowflake, Trees, Gift, LogOut, User as UserIcon, Coins } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { LoginModal } from "./LoginModal"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-6xl mx-auto glass-panel rounded-2xl flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] shadow-[0_0_15px_var(--accent-glow)] flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          </div>
          <span className="font-bold text-xl tracking-tight">Push Stop</span>
        </div>

        {/* Theme Switcher removed - will be controlled via Admin */}
          
        {/* Auth Button / User Profile */}
        <div className="flex flex-col items-end">
          {status === "loading" ? (
            <div className="w-24 h-8 bg-gray-200/20 animate-pulse rounded-lg" />
          ) : session?.user ? (
            <div className="flex items-center gap-4">
              <Link href="/profile" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                <div className="flex flex-col items-end">
                  <span className="font-semibold text-sm">{session.user.name || (session.user as any).nickname || "유저"}</span>
                  <span className="text-xs text-[var(--accent-primary)] flex items-center gap-1">
                    <Coins className="w-3 h-3" /> {(session.user as any).balance?.toLocaleString() || 0} P
                  </span>
                </div>
                {session.user.image ? (
                  <img src={session.user.image} alt="Profile" className="w-10 h-10 rounded-full border-2 border-[var(--panel-border)] object-cover" />
                ) : (
                  <img src="/default-avatar.svg" alt="Default Profile" className="w-10 h-10 rounded-full border-2 border-[var(--panel-border)] object-cover" />
                )}
              </Link>
              <button onClick={() => signOut()} className="p-2 text-[var(--text-secondary)] hover:text-red-400 transition-colors" title="로그아웃">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsLoginModalOpen(true)}
              className="px-5 py-2 bg-white text-black font-semibold rounded-xl hover:scale-105 transition-transform"
            >
              로그인
            </button>
          )}
        </div>
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </nav>
  )
}

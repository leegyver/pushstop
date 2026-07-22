"use client"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Monitor, Moon, Sun, Snowflake, Trees, Gift } from "lucide-react"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

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

        {/* Theme Switcher & Actions */}
        <div className="flex items-center gap-4">
          {mounted && (
            <div className="flex bg-[var(--bg-gradient-start)] p-1 rounded-xl border border-[var(--panel-border)]">
              <button onClick={() => setTheme('system')} className={`p-2 rounded-lg transition-colors ${theme === 'system' ? 'bg-[var(--panel-bg)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-white'}`} title="System / Default">
                <Monitor className="w-4 h-4" />
              </button>
              <button onClick={() => setTheme('summer')} className={`p-2 rounded-lg transition-colors ${theme === 'summer' ? 'bg-[var(--panel-bg)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-white'}`} title="Summer Theme">
                <Sun className="w-4 h-4" />
              </button>
              <button onClick={() => setTheme('winter')} className={`p-2 rounded-lg transition-colors ${theme === 'winter' ? 'bg-[var(--panel-bg)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-white'}`} title="Winter Theme">
                <Snowflake className="w-4 h-4" />
              </button>
              <button onClick={() => setTheme('christmas')} className={`p-2 rounded-lg transition-colors ${theme === 'christmas' ? 'bg-[var(--panel-bg)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-white'}`} title="Christmas Theme">
                <Gift className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Example Auth Button / Balance */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs text-[var(--text-secondary)]">로그인 해주세요</span>
          </div>
        </div>
      </div>
    </nav>
  )
}

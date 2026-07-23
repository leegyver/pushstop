"use client"
import { motion } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import { StopButton } from "./StopButton"

interface GameTimerProps {
  targetTimeMs: number
  serverTimeOffset: number
  onStop?: (exactMs: number) => void
  disabled?: boolean
}

export function GameTimer({ targetTimeMs, serverTimeOffset, onStop, disabled }: GameTimerProps) {
  const [currentMs, setCurrentMs] = useState(0)
  const isStopped = useRef(false)

  useEffect(() => {
    let animationFrameId: number
    const start = performance.now() - 34000 // Start from some random offset

    const update = () => {
      if (!isStopped.current) {
        // performance.now() is high-precision. We get the absolute time by:
        // AbsoluteSyncTime = Date.now() + serverTimeOffset + small performance adjustments.
        // For simplicity and high precision:
        setCurrentMs(Date.now() + serverTimeOffset)
        animationFrameId = requestAnimationFrame(update)
      }
    }
    
    animationFrameId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(animationFrameId)
  }, [serverTimeOffset])

  const handleStop = () => {
    if (disabled || isStopped.current) return
    isStopped.current = true
    if (onStop) {
      onStop(currentMs)
    }
  }

  // Format absolute KST Time HH:MM:SS.xxxx
  const formatTime = (ms: number) => {
    // Add KST offset (UTC +9)
    const kstMs = ms + (9 * 60 * 60 * 1000)
    const date = new Date(kstMs)
    
    const hh = date.getUTCHours().toString().padStart(2, '0')
    const mm = date.getUTCMinutes().toString().padStart(2, '0')
    const ss = date.getUTCSeconds().toString().padStart(2, '0')
    const fraction = Math.floor((kstMs % 1000) * 10).toString().padStart(4, '0')
    return { hh, mm, ss, fraction }
  }

  const { hh, mm, ss, fraction } = formatTime(currentMs)

  return (
    <>
    <div className="flex flex-col items-center justify-center p-8 glass-panel rounded-3xl relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[var(--accent-glow)] opacity-0 group-hover:opacity-20 transition-opacity duration-1000 blur-3xl rounded-full" />
      
      <div className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--text-secondary)] mb-2">
        현재 시간 (KST)
      </div>
      
      {/* Big Animated Timer */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-6xl md:text-7xl font-black tabular-nums tracking-tight flex items-baseline gap-2 z-10"
      >
        <span className="text-white">{hh}:{mm}:{ss}</span>
        <span className="text-[var(--accent-primary)] text-4xl md:text-5xl">.{fraction}</span>
      </motion.div>
      
      <div className="mt-8 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center">
        <div className="text-xs text-[var(--text-secondary)] mb-1 uppercase font-bold tracking-wider">목표 시간 (Target Time)</div>
        <div className="text-2xl font-mono font-bold text-green-400">
          {formatTime(targetTimeMs).hh}:{formatTime(targetTimeMs).mm}:{formatTime(targetTimeMs).ss}.0000
        </div>
      </div>
    </div>
    
    <div className="w-full mt-4">
      {/* We need the StopButton to call handleStop. Wait, the page component handles StopButton? 
          Ah, I removed StopButton from page.tsx and just put GameTimer. Let's include StopButton here. */}
      <StopButton onClick={handleStop} disabled={disabled || isStopped.current} />
    </div>
    </>
  )
}

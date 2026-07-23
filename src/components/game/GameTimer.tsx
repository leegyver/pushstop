"use client"
import { motion } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import { StopButton } from "./StopButton"

interface GameTimerProps {
  targetTimeMs: number
  serverTimeOffset: number
  onStop: (exactTimestamp: number, eventData: any) => void
  disabled?: boolean
}

export function GameTimer({ targetTimeMs, serverTimeOffset, onStop, disabled }: GameTimerProps) {
  const [currentMs, setCurrentMs] = useState(0)
  const isStopped = useRef(false)
  const animationFrameId = useRef<number | null>(null)

  useEffect(() => {
    const update = () => {
      if (!isStopped.current) {
        setCurrentMs(Date.now() + serverTimeOffset + (performance.now() % 1))
        animationFrameId.current = requestAnimationFrame(update)
      }
    }
    
    animationFrameId.current = requestAnimationFrame(update)
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
    }
  }, [serverTimeOffset])

  const handleStopClick = (e: React.MouseEvent) => {
    if (disabled || isStopped.current) return
    
    // [BOT DEFENSE] isTrusted 속성이 false이면 스크립트에 의한 가짜 클릭
    if (!e.isTrusted) {
      console.warn("Untrusted click detected. Ignored.")
      return
    }

    isStopped.current = true
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
    
    // Stop the clock right away
    const exactStopMs = Date.now() + serverTimeOffset + (performance.now() % 1)
    setCurrentMs(exactStopMs)
    
    onStop(exactStopMs, {
      isTrusted: e.isTrusted,
      x: e.clientX,
      y: e.clientY
    })
  }

  // Format absolute KST Time HH:MM:SS.xxxx
  const formatTime = (ms: number) => {
    // Add KST offset (UTC +9)
    const kstMs = ms + (9 * 60 * 60 * 1000)
    // Date constructor only takes integers, so we floor it
    const date = new Date(Math.floor(kstMs))
    
    const hh = date.getUTCHours().toString().padStart(2, '0')
    const mm = date.getUTCMinutes().toString().padStart(2, '0')
    const ss = date.getUTCSeconds().toString().padStart(2, '0')
    
    // Get the fractional part of milliseconds (e.g. 123.4567 -> 0.4567)
    // We multiply by 10 to get 4 digits: (123.4567 % 1000) * 10 = 1234.567
    // Floor it to 1234
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
          {formatTime(targetTimeMs).hh}:{formatTime(targetTimeMs).mm}:{formatTime(targetTimeMs).ss}.{formatTime(targetTimeMs).fraction}
        </div>
      </div>
    </div>
    
    <div className="w-full mt-4">
      {/* We need the StopButton to call handleStopClick. */}
      <StopButton onClick={handleStopClick} disabled={disabled || isStopped.current} />
    </div>
    </>
  )
}

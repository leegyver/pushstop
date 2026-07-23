"use client"
import { motion } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import { StopButton } from "./StopButton"

interface GameTimerProps {
  targetTimeMs: number
  onStop?: (exactMs: number) => void
  disabled?: boolean
}

export function GameTimer({ targetTimeMs, onStop, disabled }: GameTimerProps) {
  const [currentMs, setCurrentMs] = useState(0)
  const isStopped = useRef(false)

  // Mock a running timer for the landing page visual
  useEffect(() => {
    let animationFrameId: number
    const start = performance.now() - 34000 // Start from some random offset

    const update = (time: number) => {
      if (!isStopped.current) {
        setCurrentMs((time - start) % 60000) // Loop every 60s
        animationFrameId = requestAnimationFrame(update)
      }
    }
    
    animationFrameId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  const handleStop = () => {
    if (disabled || isStopped.current) return
    isStopped.current = true
    if (onStop) {
      onStop(currentMs)
    }
  }

  // Format MM:SS.ms (ms up to 4 digits)
  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000).toString().padStart(2, '0')
    const secs = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0')
    const fraction = Math.floor((ms % 1000) * 10).toString().padStart(4, '0')
    return { mins, secs, fraction }
  }

  const { mins, secs, fraction } = formatTime(currentMs)

  return (
    <>
    <div className="flex flex-col items-center justify-center p-8 glass-panel rounded-3xl relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[var(--accent-glow)] opacity-0 group-hover:opacity-20 transition-opacity duration-1000 blur-3xl rounded-full" />
      
      <div className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--text-secondary)] mb-4">
        Current Target Time
      </div>
      
      {/* Big Animated Timer */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-6xl md:text-8xl font-black tabular-nums tracking-tight flex items-baseline gap-2 z-10"
      >
        <span className="text-white">{mins}:{secs}</span>
        <span className="text-[var(--accent-primary)] text-4xl md:text-6xl">.{fraction}</span>
      </motion.div>
    </div>
    
    <div className="w-full mt-4">
      {/* We need the StopButton to call handleStop. Wait, the page component handles StopButton? 
          Ah, I removed StopButton from page.tsx and just put GameTimer. Let's include StopButton here. */}
      <StopButton onClick={handleStop} disabled={disabled || isStopped.current} />
    </div>
    </>
  )
}

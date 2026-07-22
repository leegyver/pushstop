"use client"
import { motion } from "framer-motion"

interface StopButtonProps {
  onClick?: () => void
  disabled?: boolean
}

export function StopButton({ onClick, disabled }: StopButtonProps) {
  return (
    <div className="relative flex justify-center items-center w-full max-w-sm mx-auto my-12">
      {/* Pulse Rings */}
      {!disabled && (
        <>
          <motion.div 
            animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border border-[var(--accent-primary)] pointer-events-none"
          />
          <motion.div 
            animate={{ scale: [1, 1.8, 2.5], opacity: [0.3, 0, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            className="absolute inset-0 rounded-full border border-[var(--accent-secondary)] pointer-events-none"
          />
        </>
      )}

      {/* Main Button */}
      <motion.button
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        onClick={onClick}
        disabled={disabled}
        className={`relative z-10 w-48 h-48 md:w-56 md:h-56 rounded-full flex items-center justify-center font-black text-4xl md:text-5xl tracking-tighter text-white shadow-[0_0_40px_var(--btn-stop-glow)] border-4 border-white/20 transition-all
          ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:shadow-[0_0_60px_var(--btn-stop-glow)]'}
        `}
        style={{ background: 'var(--btn-stop-bg)' }}
      >
        <span className="relative z-20">STOP</span>
        
        {/* Inner Glass Highlight */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
      </motion.button>
    </div>
  )
}

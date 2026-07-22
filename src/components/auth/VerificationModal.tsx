"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSession } from "next-auth/react"
import { ShieldAlert, Loader2, CheckCircle2 } from "lucide-react"

export function VerificationModal() {
  const { data: session, update, status } = useSession()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"REQUEST" | "VERIFY" | "SUCCESS">("REQUEST")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Only show if logged in but NOT verified
  const isVisible = session?.user && !(session.user as any).isVerified

  if (!isVisible) return null;

  const handleRequest = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("올바른 휴대폰 번호를 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Dummy recaptcha token for now
      const recaptchaToken = "dummy-token"; 
      
      const res = await fetch("/api/verify/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, recaptchaToken })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "인증번호 발송 실패");
      
      setStep("VERIFY");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError("6자리 인증번호를 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/verify/phone/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, code })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "인증 실패");
      
      setStep("SUCCESS");
      // Update NextAuth session to reflect isVerified = true
      await update({ isVerified: true });
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-[var(--panel-bg)] border border-[var(--panel-border)] p-8 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(255,0,0,0.15)]"
      >
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">필수 본인 인증</h2>
          <p className="text-[var(--text-secondary)] text-sm">
            다중 계정 및 매크로 악용을 방지하기 위해<br />
            1회 휴대폰 본인 인증이 필요합니다.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        {step === "REQUEST" && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">휴대폰 번호 (- 제외)</label>
              <input 
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="01012345678"
                className="w-full bg-black/50 border border-[var(--panel-border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--accent-primary)] transition-colors text-white"
                maxLength={11}
              />
            </div>
            <button 
              onClick={handleRequest}
              disabled={loading || phoneNumber.length < 10}
              className="w-full py-3 px-4 bg-[var(--accent-primary)] text-white font-bold rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "인증번호 발송"}
            </button>
          </div>
        )}

        {step === "VERIFY" && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">인증번호 6자리</label>
              <input 
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                className="w-full bg-black/50 border border-[var(--panel-border)] rounded-xl px-4 py-3 text-center tracking-[0.5em] text-xl font-bold outline-none focus:border-[var(--accent-primary)] transition-colors text-white"
                maxLength={6}
              />
            </div>
            <button 
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              className="w-full py-3 px-4 bg-[var(--accent-primary)] text-white font-bold rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "인증 확인"}
            </button>
            <button 
              onClick={() => setStep("REQUEST")}
              className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              번호 다시 입력
            </button>
          </div>
        )}

        {step === "SUCCESS" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-2" />
            <p className="text-lg font-bold text-green-400">인증이 완료되었습니다!</p>
            <p className="text-sm text-[var(--text-secondary)]">이제 정상적으로 게임에 참여하실 수 있습니다.</p>
          </div>
        )}

      </motion.div>
    </div>
  )
}

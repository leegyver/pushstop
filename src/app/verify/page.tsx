"use client"
import { useState } from 'react'

export default function VerifyPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'SEND' | 'VERIFY'>('SEND')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendSMS = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/verify/phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStep('VERIFY')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/verify/phone/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = '/game' // Success
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 p-8 rounded-3xl border border-neutral-800 shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-2">휴대폰 본인 인증</h1>
        <p className="text-neutral-400 text-sm text-center mb-8">안전한 게임 환경을 위해 본인 인증이 필요합니다.<br/>(동일 번호 최대 3개 계정)</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">휴대폰 번호 (- 없이 입력)</label>
            <input 
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
              disabled={step === 'VERIFY' || loading}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
              placeholder="01012345678"
            />
          </div>

          {step === 'VERIFY' && (
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">인증 코드 6자리</label>
              <input 
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                disabled={loading}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="000000"
              />
            </div>
          )}

          <button
            onClick={step === 'SEND' ? handleSendSMS : handleVerifyCode}
            disabled={loading || (step === 'SEND' ? phoneNumber.length < 10 : code.length !== 6)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? '처리 중...' : (step === 'SEND' ? '인증번호 발송' : '인증 완료 및 시작')}
          </button>
        </div>
      </div>
    </div>
  )
}

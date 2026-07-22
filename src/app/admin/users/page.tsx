"use client"
import Link from 'next/link'
import { ArrowLeft, Search, Ban, History } from 'lucide-react'

export default function AdminUsersPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-primary)] p-8">
      <header className="mb-8">
        <Link href="/admin" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> 대시보드로 돌아가기
        </Link>
        <h1 className="text-3xl font-bold text-gradient">회원 및 보안 관리</h1>
        <p className="text-[var(--text-secondary)] mt-2">유저 리스트, 포인트 제어, 다중 계정 차단</p>
      </header>

      <div className="glass-panel p-6 rounded-2xl mb-8">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-3 text-[var(--text-secondary)]" />
            <input type="text" placeholder="이름, 닉네임, 휴대폰 번호로 검색..." className="w-full bg-black/50 border border-[var(--panel-border)] rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-[var(--accent-primary)] transition" />
          </div>
          <button className="bg-[var(--accent-primary)] text-black font-bold px-6 py-2.5 rounded-xl hover:opacity-90">검색</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--panel-border)] text-[var(--text-secondary)]">
                <th className="py-3 px-4 font-medium">유저 ID</th>
                <th className="py-3 px-4 font-medium">닉네임</th>
                <th className="py-3 px-4 font-medium">포인트 잔액</th>
                <th className="py-3 px-4 font-medium">의심 지수 (Bot)</th>
                <th className="py-3 px-4 font-medium">상태</th>
                <th className="py-3 px-4 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {/* Mock Users */}
              <tr className="border-b border-[var(--panel-border)]/50 hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 font-mono text-sm">user_1a2b3c</td>
                <td className="py-3 px-4">SpeedyGamer</td>
                <td className="py-3 px-4 font-bold text-emerald-400">12,500 P</td>
                <td className="py-3 px-4">
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-md text-xs">안전 (0.1)</span>
                </td>
                <td className="py-3 px-4 text-emerald-400 text-sm">활성</td>
                <td className="py-3 px-4 flex gap-2">
                  <button className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/40" title="포인트 내역">
                    <History className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/40" title="계정 차단">
                    <Ban className="w-4 h-4" />
                  </button>
                </td>
              </tr>
              <tr className="border-b border-[var(--panel-border)]/50 hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 font-mono text-sm">user_9x8y7z</td>
                <td className="py-3 px-4">MacroBot_001</td>
                <td className="py-3 px-4 font-bold text-emerald-400">850,000 P</td>
                <td className="py-3 px-4">
                  <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded-md text-xs font-bold">위험 (98.5)</span>
                </td>
                <td className="py-3 px-4 text-red-400 text-sm">차단됨</td>
                <td className="py-3 px-4 flex gap-2">
                  <button className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/40" title="포인트 내역">
                    <History className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/40" title="계정 차단 해제">
                    <Ban className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

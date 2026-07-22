"use client"
import Link from 'next/link'
import { ArrowLeft, Play, Square, Trophy } from 'lucide-react'

export default function AdminRoundsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-primary)] p-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <Link href="/admin" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> 대시보드로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gradient">게임 라운드 관리</h1>
          <p className="text-[var(--text-secondary)] mt-2">실시간 라운드 제어 및 과거 랭킹/순위 DB 열람</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-xl hover:bg-red-500/30 transition">
            <Square className="w-4 h-4" /> 전체 게임 일시정지
          </button>
          <button className="flex items-center gap-2 bg-emerald-500 text-black font-bold px-4 py-2 rounded-xl hover:opacity-90 transition">
            <Play className="w-4 h-4" /> 새 라운드 즉시 시작
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Round Info */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl h-fit border-[var(--accent-primary)]/30">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl font-bold text-emerald-400">진행 중인 라운드</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">라운드 ID</span>
              <span className="font-mono">rnd_a1b2c3d4</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">타겟 시간</span>
              <span className="font-bold">1735689600000.0000</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">총 누적 상금(Point)</span>
              <span className="font-bold text-yellow-400">45,000 P</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">현재 참여자 수</span>
              <span>1,204 명</span>
            </div>
            
            <div className="pt-4 border-t border-[var(--panel-border)]">
              <p className="text-xs text-[var(--text-secondary)] mb-2">실시간 1위 근접 기록</p>
              <div className="bg-black/40 p-3 rounded-xl border border-emerald-500/20 flex justify-between items-center">
                <span className="font-medium text-emerald-300">FastClicker</span>
                <span className="font-mono text-sm">+0.0123s 차이</span>
              </div>
            </div>
          </div>
        </div>

        {/* Past Rounds History */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-6">최근 완료된 라운드 기록</h2>
          
          <div className="space-y-4">
            {/* Mock Round Row */}
            <div className="bg-black/30 border border-[var(--panel-border)] rounded-xl p-4">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-[var(--panel-border)]/50">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">Round #1203</span>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md">정산 완료</span>
                </div>
                <span className="text-sm text-[var(--text-secondary)]">2023-10-25 14:30 종료</span>
              </div>
              
              <div>
                <h4 className="text-sm font-bold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" /> 최종 순위 명단 (DB 영구 보존)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <div className="text-xs text-yellow-500 font-bold mb-1">1위 (Gold)</div>
                    <div className="font-medium">User_Alpha</div>
                    <div className="text-xs font-mono text-[var(--text-secondary)] mt-1">오차: 0.0001s</div>
                  </div>
                  <div className="bg-slate-300/10 border border-slate-300/20 rounded-lg p-3">
                    <div className="text-xs text-slate-300 font-bold mb-1">2위 (Silver)</div>
                    <div className="font-medium">BetaTester</div>
                    <div className="text-xs font-mono text-[var(--text-secondary)] mt-1">오차: 0.0014s</div>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                    <div className="text-xs text-orange-400 font-bold mb-1">3위 (Bronze)</div>
                    <div className="font-medium">GammaRay</div>
                    <div className="text-xs font-mono text-[var(--text-secondary)] mt-1">오차: 0.0028s</div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart 
} from 'recharts'
import { Activity, Users, MousePointerClick, Clock, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [data, setData] = useState<{stats: any[], summary: any}>({ stats: [], summary: {} })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-8 text-[var(--text-secondary)]">Loading dashboard data...</div>
  }

  const { stats, summary } = data

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-primary)] p-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gradient">Admin Dashboard</h1>
          <p className="text-[var(--text-secondary)]">푸시스톱 종합 운영 현황 및 마케팅 통계</p>
        </div>
        <div className="flex gap-4">
          <Link href="/admin/users" className="glass-panel px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition">회원 관리</Link>
          <Link href="/admin/rounds" className="glass-panel px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition">라운드 관리</Link>
          <Link href="/admin/settings" className="glass-panel px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition">시스템 설정</Link>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[var(--text-secondary)] font-medium">최근 7일 방문자</h3>
            <Users className="w-5 h-5 text-[var(--accent-primary)]" />
          </div>
          <p className="text-3xl font-bold">{summary.totalVisitors?.toLocaleString()}</p>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[var(--text-secondary)] font-medium">총 페이지뷰</h3>
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold">{summary.totalPageViews?.toLocaleString()}</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[var(--text-secondary)] font-medium">게임 참여 수</h3>
            <MousePointerClick className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-3xl font-bold">{summary.totalParticipations?.toLocaleString()}</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[var(--text-secondary)] font-medium">평균 체류 시간</h3>
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold">
            {Math.floor((summary.avgDwellTimeSeconds || 0) / 60)}분 {(summary.avgDwellTimeSeconds || 0) % 60}초
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Visitors vs Participations Line Chart */}
        <div className="glass-panel p-6 rounded-2xl h-96">
          <h3 className="text-lg font-bold mb-6">트래픽 및 전환율 추이</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPart" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--panel-border)', borderRadius: '12px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Legend />
              <Area type="monotone" dataKey="visitors" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorVis)" name="방문자 수" />
              <Area type="monotone" dataKey="participations" stroke="#f59e0b" fillOpacity={1} fill="url(#colorPart)" name="참여 수" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Page Views Chart */}
        <div className="glass-panel p-6 rounded-2xl h-96">
          <h3 className="text-lg font-bold mb-6">일별 페이지뷰</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--panel-border)', borderRadius: '12px' }}
              />
              <Line type="monotone" dataKey="pageViews" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} name="페이지뷰" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Security Alerts (Anti-cheat) */}
      <div className="glass-panel p-6 rounded-2xl border border-red-500/30 bg-red-500/5">
        <div className="flex items-center gap-3 mb-4">
          <ShieldAlert className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-bold text-red-100">최근 보안 및 봇 탐지 알림</h3>
        </div>
        <div className="space-y-3">
          {/* Mock Alerts */}
          <div className="flex justify-between items-center py-2 border-b border-red-500/20">
            <span className="text-sm text-red-200">[다중계정 의심] 동일 디바이스에서 4개의 계정 로그인 시도 차단됨</span>
            <span className="text-xs text-red-400">10분 전</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-red-500/20">
            <span className="text-sm text-red-200">[통계적 봇 탐지] 비정상적인 정밀도(StdDev &lt; 2.0ms)의 라운드 참여 패턴 적발</span>
            <span className="text-xs text-red-400">1시간 전</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-red-200">[Proof of Work] 퍼즐 풀이 실패율 15% 상승 (디도스 의심)</span>
            <span className="text-xs text-red-400">어제</span>
          </div>
        </div>
      </div>
    </div>
  )
}

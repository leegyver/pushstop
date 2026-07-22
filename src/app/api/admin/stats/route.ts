import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/crypto/jwt'
import { cookies } from 'next/headers'

export async function GET(req: Request) {
  try {
    // Verify Admin Access
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    if (!sessionToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const payload = await verifyToken(sessionToken)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // In a real scenario, this would aggregate DailyStat model data
    // For now, we mock some recent data to feed the Recharts component
    const stats = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return {
        date: date.toISOString().split('T')[0],
        visitors: Math.floor(Math.random() * 500) + 100,
        pageViews: Math.floor(Math.random() * 2000) + 300,
        participations: Math.floor(Math.random() * 1500) + 200,
      }
    })

    const summary = {
      totalVisitors: stats.reduce((acc, curr) => acc + curr.visitors, 0),
      totalPageViews: stats.reduce((acc, curr) => acc + curr.pageViews, 0),
      totalParticipations: stats.reduce((acc, curr) => acc + curr.participations, 0),
      avgDwellTimeSeconds: 145, // ~2.5 minutes
    }

    return NextResponse.json({ success: true, stats, summary })
  } catch (error) {
    console.error('Admin Stats API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

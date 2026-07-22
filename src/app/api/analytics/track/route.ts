import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/crypto/jwt'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { path, heartbeatTime } = await req.json()
    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1'
    const userAgent = req.headers.get('user-agent') || ''

    // Attempt to get user ID if logged in
    let userId = null
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    if (sessionToken) {
      const payload = await verifyToken(sessionToken)
      if (payload) userId = payload.userId
    }

    // Upsert PageView based on path and IP for the same day to simulate session
    const todayStr = new Date().toISOString().split('T')[0]
    
    // Instead of upserting based on a complex session, we'll just create a record 
    // or update an existing one if the user just navigated within 30 mins.
    // For simplicity, we just create a new record if it's the initial ping, 
    // and update dwellTime if it's a heartbeat (passing an ID).
    
    const { pageViewId } = await req.json()

    if (pageViewId) {
      // It's a heartbeat, update dwell time
      await prisma.pageView.update({
        where: { id: pageViewId },
        data: { dwellTime: { increment: heartbeatTime || 10 } }
      })
      
      return NextResponse.json({ success: true, pageViewId })
    } else {
      // It's a new page view
      const newView = await prisma.pageView.create({
        data: {
          path,
          ipAddress,
          userId,
          userAgent,
          dwellTime: 0
        }
      })
      return NextResponse.json({ success: true, pageViewId: newView.id })
    }

  } catch (error) {
    console.error('Analytics Track Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

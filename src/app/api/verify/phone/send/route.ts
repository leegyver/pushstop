import { NextResponse } from 'next/server'
import { sendVerificationCode } from '../../../../../services/verification'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { phoneNumber } = await req.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Get client IP for rate limiting
    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1'

    await sendVerificationCode(phoneNumber, ipAddress)

    return NextResponse.json({ success: true, message: 'Verification code sent.' })
  } catch (error: any) {
    const status = error.message.includes('RATE_LIMIT') || error.message.includes('COOLDOWN') ? 429 : 400
    return NextResponse.json({ error: error.message || 'Failed to send SMS.' }, { status })
  }
}

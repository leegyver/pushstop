import { NextResponse } from 'next/server'
import { verifyCode } from '../../../../../services/verification'
import { verifyToken } from '../../../../../lib/crypto/jwt'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { phoneNumber, code } = await req.json()

    if (!phoneNumber || !code) {
      return NextResponse.json({ error: 'Phone number and code are required' }, { status: 400 })
    }

    // Get userId from session cookie
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(sessionToken)
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Verify SMS Code
    await verifyCode(payload.userId, phoneNumber, code)

    return NextResponse.json({ success: true, message: 'Phone number verified successfully.' })
  } catch (error: any) {
    const status = error.message.includes('EXPIRED') || error.message.includes('MAX_ATTEMPTS') ? 403 : 400
    return NextResponse.json({ error: error.message || 'Verification failed.' }, { status })
  }
}

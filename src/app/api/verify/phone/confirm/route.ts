import { NextResponse } from 'next/server'
import { verifyCode } from '../../../../../services/verification'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function POST(req: Request) {
  try {
    const { phoneNumber, code } = await req.json()

    if (!phoneNumber || !code) {
      return NextResponse.json({ error: 'Phone number and code are required' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify SMS Code
    await verifyCode(session.user.id, phoneNumber, code)

    return NextResponse.json({ success: true, message: 'Phone number verified successfully.' })
  } catch (error: any) {
    const status = error.message.includes('EXPIRED') || error.message.includes('MAX_ATTEMPTS') ? 403 : 400
    return NextResponse.json({ error: error.message || 'Verification failed.' }, { status })
  }
}

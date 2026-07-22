import { NextResponse } from 'next/server'
import { AuthService } from '../../../../../services/auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  try {
    // In a real application, you would exchange the 'code' for an access_token 
    // with Google's OAuth endpoint here. For this template, we assume we got the profile.
    
    // MOCK PROFILE FETCH (Replace with actual fetch to https://www.googleapis.com/oauth2/v2/userinfo)
    const mockProfile = {
      provider: 'google' as const,
      providerId: `g_${Math.random().toString(36).substr(2, 9)}`,
      nickname: 'GoogleUser',
    }

    const token = await AuthService.handleOAuthLogin(mockProfile)

    const response = NextResponse.redirect(new URL('/verify', request.url))
    
    // Set HTTP-only cookie
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return response
  } catch (error: any) {
    console.error('Google Auth Error:', error)
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url))
  }
}

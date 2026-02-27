import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify, SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'development-secret-change-in-production'
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid-token', request.url))
    }

    // Verify the token
    const { payload } = await jwtVerify(token, JWT_SECRET)

    if (payload.type !== 'magic-link') {
      return NextResponse.redirect(new URL('/login?error=invalid-token', request.url))
    }

    // Create session token
    const sessionToken = await new SignJWT({
      userId: payload.userId,
      email: payload.email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.redirect(new URL('/login?error=invalid-token', request.url))
  }
}

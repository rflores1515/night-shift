import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { z } from 'zod'
import { Resend } from 'resend'

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'development-secret-key'
)

const isDev = process.env.NODE_ENV !== 'production'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsed = z.object({ email: z.string().email() }).safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const email = parsed.data.email

    // In development, allow simple sign-in without verification
    if (isDev) {
      let user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: email.split('@')[0],
          },
        })
      }

      // Create a session token
      const token = await new SignJWT({
        userId: user.id,
        email: user.email,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET)

      const cookieStore = await cookies()
      cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })

      return NextResponse.json({ success: true })
    }

    // Production: Use magic link via Resend
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Find or create user (pending verification)
    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
        },
      })
    }

    // Generate verification token
    const verificationToken = await new SignJWT({
      userId: user.id,
      email: user.email,
      type: 'magic-link',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(JWT_SECRET)

    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify?token=${verificationToken}`

    // Send magic link email
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Night Shift <noreply@night-shift.local>',
      to: email,
      subject: 'Sign in to Night Shift',
      html: `
        <h1>Sign in to Night Shift</h1>
        <p>Click the link below to sign in:</p>
        <a href="${magicLink}">${magicLink}</a>
        <p>This link expires in 1 hour.</p>
      `,
    })

    return NextResponse.json({ success: true, message: 'Magic link sent' })
  } catch (error) {
    console.error('Sign in error:', error)
    return NextResponse.json({ error: 'Sign in failed' }, { status: 500 })
  }
}

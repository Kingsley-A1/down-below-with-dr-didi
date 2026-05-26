import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/admin/user-repository'
import { getRateLimiter, RATE_LIMIT_CONFIG } from '@/lib/auth/rate-limiter'
import { extractClientIP, generateRateLimitKey } from '@/lib/security'
import { userRegisterSchema } from '@/lib/validations'
import { sendEmail } from '@/lib/email/send'
import { verifyEmail as verifyEmailTemplate } from '@/lib/email/templates'
import { env } from '@/lib/env'

function isMissingUserTableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  return error.message.includes('The table `public.User` does not exist')
}

function buildVerifyUrl(token: string) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  return `${base}/verify-email?token=${encodeURIComponent(token)}`
}

export async function POST(request: NextRequest) {
  try {
    const limiter = getRateLimiter()
    const ip = extractClientIP({
      'x-forwarded-for': request.headers.get('x-forwarded-for') ?? undefined,
      'x-real-ip': request.headers.get('x-real-ip') ?? undefined,
    })
    const rateLimitKey = generateRateLimitKey('register', null, ip)

    const rateResult = limiter.isAllowed(
      rateLimitKey,
      RATE_LIMIT_CONFIG.register.limit,
      RATE_LIMIT_CONFIG.register.windowMs
    )

    if (!rateResult.allowed) {
      const retryAfterSeconds = Math.ceil((rateResult.retryAfterMs ?? 0) / 1000)
      const response = NextResponse.json(
        {
          success: false,
          error: RATE_LIMIT_CONFIG.register.message,
        },
        { status: 429 }
      )
      response.headers.set('Retry-After', String(retryAfterSeconds))
      return response
    }

    const body = await request.json()

    const validation = userRegisterSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { email, displayName, password, phone } = validation.data
    const normalizedEmail = email.trim().toLowerCase()

    const result = await createUser(normalizedEmail, displayName, password, phone)
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 400 }
      )
    }

    const verifyUrl = buildVerifyUrl(result.verificationToken)
    const template = verifyEmailTemplate({
      recipientName: result.user.displayName,
      actionUrl: verifyUrl,
      expiresInMinutes: Math.round((result.verificationExpiresAt.getTime() - Date.now()) / 60_000),
    })

    const sendResult = await sendEmail({
      to: result.user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    // Don't fail the request if email send fails — the user can request a resend.
    // In production we surface the failure so the UI can show a "request a new
    // link" CTA. In dev we still want the registration to succeed cleanly.
    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful. Check your email to verify your account before signing in.',
        user: result.user,
        emailSent: sendResult.ok,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)

    if (isMissingUserTableError(error)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication database is not initialized yet. Please run migrations and try again.',
        },
        { status: 503 }
      )
    }

    if (error instanceof Error && error.message.toLowerCase().includes('already exists')) {
      // Generic message — don't confirm existence of an account.
      return NextResponse.json(
        {
          success: false,
          error: 'Registration could not be completed. If you already have an account, sign in instead.',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      },
      { status: 500 }
    )
  }
}

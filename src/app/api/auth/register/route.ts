import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/admin/user-repository'
import { DuplicateEmailError } from '@/lib/admin/errors'
import { RATE_LIMIT_CONFIG } from '@/lib/auth/rate-limiter'
import { checkRateLimit } from '@/lib/rate-limit'
import { extractClientIP, generateRateLimitKey } from '@/lib/security'
import { userRegisterSchema } from '@/lib/validations'
import { sendEmail } from '@/lib/email/send'
import { verifyEmail as verifyEmailTemplate } from '@/lib/email/templates'
import { env } from '@/lib/env'
import {
  validationError,
  duplicateEmail,
  rateLimited,
  serverError,
  serviceUnavailable,
} from '@/lib/api/errors'

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
    const ip = extractClientIP({
      'x-forwarded-for': request.headers.get('x-forwarded-for') ?? undefined,
      'x-real-ip': request.headers.get('x-real-ip') ?? undefined,
    })
    const rateLimitKey = generateRateLimitKey('register', null, ip)

    const rateResult = await checkRateLimit({
      key: rateLimitKey,
      limit: RATE_LIMIT_CONFIG.register.limit,
      windowMs: RATE_LIMIT_CONFIG.register.windowMs,
    })

    if (rateResult.limited) {
      const retryAfterSeconds = Math.ceil((rateResult.resetAt - Date.now()) / 1000)
      return rateLimited(retryAfterSeconds, RATE_LIMIT_CONFIG.register.message)
    }

    const body = await request.json()

    const validation = userRegisterSchema.safeParse(body)
    if (!validation.success) {
      return validationError(validation.error)
    }

    const { email, displayName, password, phone } = validation.data
    const normalizedEmail = email.trim().toLowerCase()

    const result = await createUser(normalizedEmail, displayName, password, phone)
    if (!result) {
      return serverError('Registration could not be completed. Please try again.', { request })
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

    return NextResponse.json(
      {
        ok: true,
        success: true,
        message: 'Registration successful. Verify your email, then sign in.',
        user: result.user,
        emailSent: sendResult.ok,
        requiresEmailVerification: true,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      return duplicateEmail('email')
    }

    if (isMissingUserTableError(error)) {
      return serviceUnavailable(
        'database_unavailable',
        'Authentication database is not initialized yet. Please run migrations and try again.',
        {
          request,
          error,
          action: 'Run Prisma migrations and verify DATABASE_URL before users register.',
        }
      )
    }

    return serverError('Registration failed. Please try again.', { request, error })
  }
}

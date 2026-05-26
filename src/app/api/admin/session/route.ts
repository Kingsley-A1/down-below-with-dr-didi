import { NextRequest, NextResponse } from 'next/server'
import { adminLoginSchema } from '@/lib/validations'
import { createAdminSessionToken, sessionCookieOptions, ADMIN_SESSION_COOKIE } from '@/lib/admin/session'
import { authenticateAdminUserWithDiagnostics } from '@/lib/admin/auth-diagnostics'
import { env } from '@/lib/env'
import { createRateLimiter, getClientIp } from '@/lib/rate-limit'

// 20 attempts per IP per 15 min — keeps casual brute-force out without
// breaking admins who fat-finger a password a handful of times.
const adminLoginIpLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 20 })
// 5 attempts per email per 15 min — tighter than the IP cap so attackers
// rotating IPs still get throttled per account.
const adminLoginIdentityLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 5 })

function isMissingAdminTableError(error: unknown) {
  return error instanceof Error && error.message.includes('The table `public.AdminUser` does not exist')
}

function rateLimitResponse(resetAt: number) {
  return NextResponse.json(
    { error: 'Too many sign-in attempts. Please wait a few minutes and try again.' },
    {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) },
    }
  )
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request)
  const ipLimit = adminLoginIpLimiter(`admin-login:ip:${clientIp}`)

  if (ipLimit.limited) {
    return rateLimitResponse(ipLimit.resetAt)
  }

  try {
    const body = await request.json()
    const parsed = adminLoginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid admin credentials', issues: parsed.error.issues }, { status: 400 })
    }

    const email = parsed.data.email.trim().toLowerCase()

    const identityLimit = adminLoginIdentityLimiter(`admin-login:email:${email}`)
    if (identityLimit.limited) {
      return rateLimitResponse(identityLimit.resetAt)
    }

    // Use enhanced authentication with diagnostics
    const authResult = await authenticateAdminUserWithDiagnostics(email, parsed.data.password)

    if (!authResult.success || !authResult.account) {
      // Distinguish lockout and email-not-verified so the UI can guide the user;
      // everything else stays generic to avoid account enumeration.
      const reason = authResult.attempt.reason
      if (reason === 'ACCOUNT_LOCKED' || reason === 'ACCOUNT_LOCKED_NOW') {
        return NextResponse.json(
          { error: 'Account temporarily locked due to too many failed attempts. Try again in 30 minutes.' },
          { status: 423 }
        )
      }

      if (reason === 'EMAIL_NOT_VERIFIED') {
        return NextResponse.json(
          {
            error: 'Email not verified. Check your inbox for the verification link.',
            requiresEmailVerification: true,
          },
          { status: 403 }
        )
      }

      const baseHint = 'Verify your credentials, then run account recovery if access still fails.'
      const suggestion = authResult.attempt.diagnostics?.diagnostics.suggestions?.[0]
      const hint = env.NODE_ENV === 'production' ? baseHint : suggestion || baseHint

      return NextResponse.json({
        error: 'Admin access denied',
        hint,
        troubleshoot: 'Double-check your email and password, then retry.',
        recover: 'Use the self-service recovery page if access is still denied.',
      }, { status: 401 })
    }

    const token = await createAdminSessionToken({
      email,
      role: authResult.account.role,
      tokenVersion: authResult.account.tokenVersion,
    })

    const response = NextResponse.json({
      success: true,
      role: authResult.account.role,
    })

    response.cookies.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions(new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString()))

    return response
  } catch (error) {
    if (isMissingAdminTableError(error)) {
      return NextResponse.json({ error: 'Admin database is not initialized yet.' }, { status: 503 })
    }

    return NextResponse.json({ error: 'Failed to create admin session' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })

  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: env.NODE_ENV !== 'development',
    path: '/',
    expires: new Date(0),
  })

  return response
}
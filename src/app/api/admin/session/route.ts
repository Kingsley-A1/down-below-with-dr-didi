import { NextRequest, NextResponse } from 'next/server'
import { adminLoginSchema } from '@/lib/validations'
import { createAdminSessionToken, sessionCookieOptions, ADMIN_SESSION_COOKIE } from '@/lib/admin/session'
import { authenticateAdminUser } from '@/lib/admin/admin-auth'
import { env } from '@/lib/env'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { serverError, serviceUnavailable, validationError } from '@/lib/api/errors'

const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000
const ADMIN_LOGIN_IP_LIMIT = 20
const ADMIN_LOGIN_IDENTITY_LIMIT = 5

function isMissingAdminTableError(error: unknown) {
  return error instanceof Error && error.message.includes('The table `public.AdminUser` does not exist')
}

function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
  return NextResponse.json(
    {
      ok: false,
      code: 'rate_limited',
      error: 'Too many sign-in attempts. Please wait a few minutes and try again.',
      retryAfter,
    },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    }
  )
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request)
  const ipLimit = await checkRateLimit({
    key: `admin-login:ip:${clientIp}`,
    windowMs: ADMIN_LOGIN_WINDOW_MS,
    limit: ADMIN_LOGIN_IP_LIMIT,
  })

  if (ipLimit.limited) {
    return rateLimitResponse(ipLimit.resetAt)
  }

  try {
    const body = await request.json()
    const parsed = adminLoginSchema.safeParse(body)

    if (!parsed.success) {
      return validationError(parsed.error)
    }

    const email = parsed.data.email.trim().toLowerCase()

    const identityLimit = await checkRateLimit({
      key: `admin-login:email:${email}`,
      windowMs: ADMIN_LOGIN_WINDOW_MS,
      limit: ADMIN_LOGIN_IDENTITY_LIMIT,
    })
    if (identityLimit.limited) {
      return rateLimitResponse(identityLimit.resetAt)
    }

    const authResult = await authenticateAdminUser(email, parsed.data.password)

    if (!authResult.ok) {
      switch (authResult.code) {
        case 'account_locked':
        case 'account_locked_now':
          return NextResponse.json(
            {
              ok: false,
              code: 'account_locked',
              error: 'Account temporarily locked due to too many failed attempts. Try again in 30 minutes.',
              retryAfter: 30 * 60,
            },
            { status: 423 }
          )
        case 'email_not_verified':
          return NextResponse.json(
            {
              ok: false,
              code: 'email_not_verified',
              error: 'Email not verified. Check your inbox for the verification link.',
            },
            { status: 403 }
          )
        case 'account_inactive':
          return NextResponse.json(
            {
              ok: false,
              code: 'account_inactive',
              error: 'Account unavailable. Contact support.',
            },
            { status: 403 }
          )
        case 'database_not_configured':
        case 'server_error':
          return serviceUnavailable(
            authResult.code === 'database_not_configured' ? 'database_unavailable' : 'service_unavailable',
            'Sign-in is temporarily unavailable. Please try again shortly.',
            {
              request,
              identity: { email },
              metadata: { authCode: authResult.code },
              action: 'Check admin database configuration and recent server logs before retrying admin sign-in.',
            }
          )
        case 'invalid_credentials':
        default:
          // Single message for both unknown-email and wrong-password to avoid
          // account enumeration.
          return NextResponse.json(
            {
              ok: false,
              code: 'invalid_credentials',
              error: 'Email or password is incorrect.',
            },
            { status: 401 }
          )
      }
    }

    const token = await createAdminSessionToken({
      email,
      role: authResult.account.role,
      tokenVersion: authResult.account.tokenVersion,
    })

    const response = NextResponse.json({
      ok: true,
      success: true,
      role: authResult.account.role,
    })

    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      token,
      sessionCookieOptions(new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString())
    )

    return response
  } catch (error) {
    if (isMissingAdminTableError(error)) {
      return serviceUnavailable('database_unavailable', 'Admin database is not initialized yet.', {
        request,
        error,
        action: 'Run Prisma migrations and verify DATABASE_URL before admin sign-in.',
      })
    }

    return serverError('Failed to create admin session', { request, error })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })

  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: env.NODE_ENV !== 'development',
    path: '/',
    expires: new Date(0),
  })

  return response
}

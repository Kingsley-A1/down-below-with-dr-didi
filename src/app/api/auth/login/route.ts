import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, getUserByEmail } from '@/lib/admin/user-repository'
import {
  checkAccountLockout,
  incrementFailedLoginAttempts,
  resetFailedLoginAttempts,
} from '@/lib/admin/user-repository-lockout'
import { RATE_LIMIT_CONFIG } from '@/lib/auth/rate-limiter'
import { createSession } from '@/lib/auth/session'
import { checkRateLimit } from '@/lib/rate-limit'
import { extractClientIP, generateRateLimitKey } from '@/lib/security'
import { userLoginSchema } from '@/lib/validations'
import {
  validationError,
  rateLimited,
  invalidCredentials,
  emailNotVerified,
  accountLocked,
  serverError,
  serviceUnavailable,
} from '@/lib/api/errors'

function isMissingUserTableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }
  return error.message.includes('The table `public.User` does not exist')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = userLoginSchema.safeParse(body)
    if (!validation.success) {
      return validationError(validation.error)
    }

    const { email, password } = validation.data
    const normalizedEmail = email.trim().toLowerCase()

    const ip = extractClientIP({
      'x-forwarded-for': request.headers.get('x-forwarded-for') ?? undefined,
      'x-real-ip': request.headers.get('x-real-ip') ?? undefined,
    })
    const loginRateLimitKey = generateRateLimitKey('login', null, ip, normalizedEmail)

    const rateResult = await checkRateLimit({
      key: loginRateLimitKey,
      limit: RATE_LIMIT_CONFIG.login.limit,
      windowMs: RATE_LIMIT_CONFIG.login.windowMs,
    })

    if (rateResult.limited) {
      const retryAfterSeconds = Math.ceil((rateResult.resetAt - Date.now()) / 1000)
      return rateLimited(retryAfterSeconds, RATE_LIMIT_CONFIG.login.message)
    }

    const candidateUser = await getUserByEmail(normalizedEmail)

    if (candidateUser) {
      const lockout = await checkAccountLockout(candidateUser.id)
      if (lockout.locked) {
        const retryAfterSeconds = Math.ceil((lockout.remainingMs ?? 0) / 1000)
        return accountLocked(retryAfterSeconds)
      }
    }

    const user = await authenticateUser(normalizedEmail, password)
    if (!user) {
      if (candidateUser) {
        const lockoutResult = await incrementFailedLoginAttempts(candidateUser.id)
        if (lockoutResult.locked) {
          const retryAfterSeconds = Math.ceil((lockoutResult.lockoutUntilMs ?? 0) / 1000)
          return accountLocked(retryAfterSeconds)
        }
      }

      return invalidCredentials()
    }

    await resetFailedLoginAttempts(user.id)

    if (!user.emailVerified) {
      return emailNotVerified()
    }

    await createSession({
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      iat: Math.floor(Date.now() / 1000),
    })

    return NextResponse.json(
      {
        ok: true,
        success: true,
        message: 'Login successful',
        user,
      },
      { status: 200 }
    )
  } catch (error) {
    if (isMissingUserTableError(error)) {
      return serviceUnavailable(
        'database_unavailable',
        'Authentication database is not initialized yet. Please run migrations and try again.',
        {
          request,
          error,
          action: 'Run Prisma migrations and verify DATABASE_URL before users sign in.',
        }
      )
    }

    return serverError('Sign-in failed. Please try again.', { request, error })
  }
}

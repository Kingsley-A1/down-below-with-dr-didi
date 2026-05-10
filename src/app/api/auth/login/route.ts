import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, getUserByEmail } from '@/lib/admin/user-repository'
import {
  checkAccountLockout,
  incrementFailedLoginAttempts,
  resetFailedLoginAttempts,
} from '@/lib/admin/user-repository-lockout'
import { getRateLimiter, RATE_LIMIT_CONFIG } from '@/lib/auth/rate-limiter'
import { createSession } from '@/lib/auth/session'
import { extractClientIP, generateRateLimitKey } from '@/lib/security'
import { userLoginSchema } from '@/lib/validations'

function isMissingUserTableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  return error.message.includes('The table `public.User` does not exist')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = userLoginSchema.safeParse(body)
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

    const { email, password } = validation.data
    const normalizedEmail = email.trim().toLowerCase()

    const ip = extractClientIP({
      'x-forwarded-for': request.headers.get('x-forwarded-for') ?? undefined,
      'x-real-ip': request.headers.get('x-real-ip') ?? undefined,
    })
    const limiter = getRateLimiter()
    const loginRateLimitKey = generateRateLimitKey('login', null, ip, normalizedEmail)

    const rateResult = limiter.isAllowed(
      loginRateLimitKey,
      RATE_LIMIT_CONFIG.login.limit,
      RATE_LIMIT_CONFIG.login.windowMs
    )

    if (!rateResult.allowed) {
      const retryAfterSeconds = Math.ceil((rateResult.retryAfterMs ?? 0) / 1000)
      const response = NextResponse.json(
        {
          success: false,
          error: RATE_LIMIT_CONFIG.login.message,
        },
        { status: 429 }
      )
      response.headers.set('Retry-After', String(retryAfterSeconds))
      return response
    }

    const candidateUser = await getUserByEmail(normalizedEmail)

    if (candidateUser) {
      const lockout = await checkAccountLockout(candidateUser.id)
      if (lockout.locked) {
        const retryAfterSeconds = Math.ceil((lockout.remainingMs ?? 0) / 1000)
        const response = NextResponse.json(
          {
            success: false,
            error: 'Account temporarily locked due to too many failed login attempts. Please try again later.',
          },
          { status: 429 }
        )
        response.headers.set('Retry-After', String(retryAfterSeconds))
        return response
      }
    }

    // Authenticate user
    const user = await authenticateUser(normalizedEmail, password)
    if (!user) {
      if (candidateUser) {
        const lockoutResult = await incrementFailedLoginAttempts(candidateUser.id)
        if (lockoutResult.locked) {
          const retryAfterSeconds = Math.ceil((lockoutResult.lockoutUntilMs ?? 0) / 1000)
          const response = NextResponse.json(
            {
              success: false,
              error: 'Account locked after multiple failed login attempts. Try again in 30 minutes.',
            },
            { status: 429 }
          )
          response.headers.set('Retry-After', String(retryAfterSeconds))
          return response
        }
      }

      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please verify your email before logging in',
        },
        { status: 403 }
      )
    }

    await resetFailedLoginAttempts(user.id)
    limiter.reset(loginRateLimitKey)

    // Create session
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
        success: true,
        message: 'Login successful',
        user,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)

    if (isMissingUserTableError(error)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication database is not initialized yet. Please run migrations and try again.',
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      },
      { status: 500 }
    )
  }
}

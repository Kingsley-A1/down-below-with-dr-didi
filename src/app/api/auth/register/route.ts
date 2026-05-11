import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/admin/user-repository'
import { getRateLimiter, RATE_LIMIT_CONFIG } from '@/lib/auth/rate-limiter'
import { extractClientIP, generateRateLimitKey } from '@/lib/security'
import { userRegisterSchema } from '@/lib/validations'

function isMissingUserTableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  return error.message.includes('The table `public.User` does not exist')
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

    // Validate input
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

    // Create user
    const result = await createUser(normalizedEmail, displayName, password, phone)
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful. You can now sign in immediately.',
        user: result.user,
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
      return NextResponse.json(
        {
          success: false,
          error: 'A user with this email already exists.',
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

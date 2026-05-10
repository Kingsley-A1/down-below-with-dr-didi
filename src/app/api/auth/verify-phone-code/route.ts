import { NextRequest, NextResponse } from 'next/server'
import { userPhoneVerifyCodeSchema } from '@/lib/validations'
import { verifyPhoneCodeAndGenerateReset, getUserByEmail } from '@/lib/admin/user-repository'
import { getRateLimiter, RATE_LIMIT_CONFIG } from '@/lib/auth/rate-limiter'
import { extractClientIP, generateRateLimitKey } from '@/lib/security'
import { getResetSessionManager } from '@/lib/auth/reset-session'

/**
 * POST /api/auth/verify-phone-code
 * Verify phone code and generate password reset token
 *
 * Request body:
 * {
 *   email: string,      // User email
 *   phone: string,      // User phone number (Nigerian format)
 *   code: string        // 6-digit verification code
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   message: string
 *   resetToken?: string  // Token to use for password reset
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = userPhoneVerifyCodeSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email, phone, or verification code',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { email, phone, code } = validationResult.data
    const normalizedEmail = email.trim().toLowerCase()

    const limiter = getRateLimiter()
    const ip = extractClientIP({
      'x-forwarded-for': request.headers.get('x-forwarded-for') ?? undefined,
      'x-real-ip': request.headers.get('x-real-ip') ?? undefined,
    })
    const rateKey = generateRateLimitKey('phone-reset-verify', null, ip, normalizedEmail)
    const rateResult = limiter.isAllowed(
      rateKey,
      RATE_LIMIT_CONFIG.verifyCode.limit,
      RATE_LIMIT_CONFIG.verifyCode.windowMs
    )

    if (!rateResult.allowed) {
      const retryAfterSeconds = Math.ceil((rateResult.retryAfterMs ?? 0) / 1000)
      const response = NextResponse.json(
        {
          success: false,
          error: RATE_LIMIT_CONFIG.verifyCode.message,
        },
        { status: 429 }
      )
      response.headers.set('Retry-After', String(retryAfterSeconds))
      return response
    }

    // Verify phone code and get reset token
    const resetToken = await verifyPhoneCodeAndGenerateReset(normalizedEmail, phone, code)

    if (!resetToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired verification code',
        },
        { status: 400 }
      )
    }

    // Get user ID for session validation
    const user = await getUserByEmail(normalizedEmail)
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 400 }
      )
    }

    // Create temporary reset session (token stays server-side)
    const sessionManager = getResetSessionManager()
    const resetSessionId = sessionManager.create(resetToken, user.id)

    return NextResponse.json(
      {
        success: true,
        message: 'Phone verification successful. You can now reset your password.',
        resetSessionId,
        userId: user.id,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Phone code verification error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while verifying your phone code',
      },
      { status: 500 }
    )
  }
}

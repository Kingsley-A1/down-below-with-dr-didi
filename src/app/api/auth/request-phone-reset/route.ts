import { NextRequest, NextResponse } from 'next/server'
import { userPhoneVerificationSchema } from '@/lib/validations'
import { generatePhoneVerificationCode } from '@/lib/admin/user-repository'
import { getRateLimiter, RATE_LIMIT_CONFIG } from '@/lib/auth/rate-limiter'
import { extractClientIP, generateRateLimitKey } from '@/lib/security'

/**
 * POST /api/auth/request-phone-reset
 * Request phone verification code for password reset
 *
 * Request body:
 * {
 *   email: string,      // User email
 *   phone: string       // User phone number (Nigerian format)
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   message: string
 *   code?: string       // For testing/development only
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = userPhoneVerificationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or phone number',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { email, phone } = validationResult.data
    const normalizedEmail = email.trim().toLowerCase()

    const limiter = getRateLimiter()
    const ip = extractClientIP({
      'x-forwarded-for': request.headers.get('x-forwarded-for') ?? undefined,
      'x-real-ip': request.headers.get('x-real-ip') ?? undefined,
    })
    const rateKey = generateRateLimitKey('phone-reset-request', null, ip, normalizedEmail)
    const rateResult = limiter.isAllowed(
      rateKey,
      RATE_LIMIT_CONFIG.phoneVerification.limit,
      RATE_LIMIT_CONFIG.phoneVerification.windowMs
    )

    if (!rateResult.allowed) {
      const retryAfterSeconds = Math.ceil((rateResult.retryAfterMs ?? 0) / 1000)
      const response = NextResponse.json(
        {
          success: false,
          error: RATE_LIMIT_CONFIG.phoneVerification.message,
        },
        { status: 429 }
      )
      response.headers.set('Retry-After', String(retryAfterSeconds))
      return response
    }

    // Generate and send phone verification code
    const verificationCode = await generatePhoneVerificationCode(normalizedEmail, phone)

    if (!verificationCode) {
      // Don't reveal if email or phone is invalid - security best practice
      return NextResponse.json(
        {
          success: true,
          message: 'If your email and phone number match our records, you will receive a verification code.',
        },
        { status: 200 }
      )
    }

    // For development/testing: return the code
    // In production, this would be sent via SMS
    const isDevelopment = process.env.NODE_ENV === 'development'

    return NextResponse.json(
      {
        success: true,
        message: 'Verification code sent to your phone.',
        ...(isDevelopment && { code: verificationCode, _message: 'Dev only: code included in response' }),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Phone reset request error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while processing your request',
      },
      { status: 500 }
    )
  }
}

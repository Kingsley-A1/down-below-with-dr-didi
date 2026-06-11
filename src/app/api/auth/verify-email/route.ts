import { NextRequest, NextResponse } from 'next/server'
import { userVerifyEmailSchema } from '@/lib/validations'
import { verifyUserEmail } from '@/lib/admin/user-repository'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { serverError, validationError } from '@/lib/api/errors'

const VERIFY_WINDOW_MS = 15 * 60 * 1000

/**
 * POST /api/auth/verify-email
 * Verify a user's email with the 6-digit code they were emailed.
 *
 * Request body:
 * {
 *   email: string  // the address the code was sent to
 *   code: string   // 6-digit verification code
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Codes are short (1e6 space), so verification is brute-forceable without a
    // limiter. Cap attempts per IP and per email.
    const ip = getClientIp(request)
    const ipLimit = await checkRateLimit({ key: `verify-email:ip:${ip}`, windowMs: VERIFY_WINDOW_MS, limit: 15 })
    if (ipLimit.limited) {
      return NextResponse.json(
        { success: false, error: 'Too many verification attempts. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((ipLimit.resetAt - Date.now()) / 1000)) } }
      )
    }

    const body = await request.json()

    const validationResult = userVerifyEmailSchema.safeParse(body)
    if (!validationResult.success) {
      return validationError(validationResult.error, 'Enter your email and the 6-digit code from your inbox.')
    }

    const { email, code } = validationResult.data

    const emailLimit = await checkRateLimit({ key: `verify-email:email:${email}`, windowMs: VERIFY_WINDOW_MS, limit: 10 })
    if (emailLimit.limited) {
      return NextResponse.json(
        { success: false, error: 'Too many verification attempts. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((emailLimit.resetAt - Date.now()) / 1000)) } }
      )
    }

    const result = await verifyUserEmail(email, code)

    if (!result.verified) {
      return NextResponse.json(
        {
          success: false,
          error:
            result.reason === 'expired'
              ? 'This verification code has expired. Request a new one and try again.'
              : 'That code is invalid. Check the 6-digit code and try again.',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully. You can now log in.',
      },
      { status: 200 }
    )
  } catch (error) {
    return serverError('An error occurred while verifying your email', { request, error })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { userVerifyEmailSchema } from '@/lib/validations'
import { verifyUserEmail } from '@/lib/admin/user-repository'
import { serverError, validationError } from '@/lib/api/errors'

/**
 * POST /api/auth/verify-email
 * Verify user email with token
 *
 * Request body:
 * {
 *   token: string  // Email verification token
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   message?: string
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = userVerifyEmailSchema.safeParse(body)
    if (!validationResult.success) {
      return validationError(validationResult.error, 'Invalid verification token format')
    }

    const { token } = validationResult.data

    // Verify email
    const emailVerified = await verifyUserEmail(token)

    if (!emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired verification token',
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

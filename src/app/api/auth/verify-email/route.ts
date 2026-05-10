import { NextRequest, NextResponse } from 'next/server'
import { userVerifyEmailSchema } from '@/lib/validations'
import { verifyUserEmail } from '@/lib/admin/user-repository'

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
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid verification token format',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
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
    console.error('Email verification error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while verifying your email',
      },
      { status: 500 }
    )
  }
}

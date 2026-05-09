import { NextRequest, NextResponse } from 'next/server'
import { userPhoneVerifyCodeSchema } from '@/lib/validations'
import { verifyPhoneCodeAndGenerateReset } from '@/lib/admin/user-repository'

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
          message: 'Invalid email, phone, or verification code',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { email, phone, code } = validationResult.data

    // Verify phone code and get reset token
    const resetToken = await verifyPhoneCodeAndGenerateReset(email, phone, code)

    if (!resetToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired verification code',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Phone verification successful. You can now reset your password.',
        resetToken,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Phone code verification error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while verifying your phone code',
      },
      { status: 500 }
    )
  }
}

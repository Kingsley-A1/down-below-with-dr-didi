import { NextRequest, NextResponse } from 'next/server'
import { userPhoneVerificationSchema } from '@/lib/validations'
import { generatePhoneVerificationCode } from '@/lib/admin/user-repository'

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
          message: 'Invalid email or phone number',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { email, phone } = validationResult.data

    // Generate and send phone verification code
    const verificationCode = await generatePhoneVerificationCode(email, phone)

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
        message: 'An error occurred while processing your request',
      },
      { status: 500 }
    )
  }
}

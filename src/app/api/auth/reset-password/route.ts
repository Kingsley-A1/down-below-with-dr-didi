import { NextRequest, NextResponse } from 'next/server'
import { resetPassword } from '@/lib/admin/user-repository'
import { userResetPasswordSchema } from '@/lib/validations'
import { getResetSessionManager } from '@/lib/auth/reset-session'

/**
 * POST /api/auth/reset-password
 * Reset password using a valid reset session ID.
 *
 * Request body:
 * {
 *   resetSessionId: string,  // From verify-phone-code response
 *   userId: string,           // User ID (validation)
 *   password: string,         // New password
 *   confirmPassword: string   // Confirm password
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

    // Validate password fields
    const validation = userResetPasswordSchema.safeParse(body)
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

    const { password } = validation.data
    const resetSessionId = body.resetSessionId as string
    const userId = body.userId as string

    // Validate required fields
    if (!resetSessionId || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing reset session ID or user ID',
        },
        { status: 400 }
      )
    }

    // Validate session and retrieve token
    const sessionManager = getResetSessionManager()
    const resetToken = sessionManager.validate(resetSessionId, userId)

    if (!resetToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired reset session',
        },
        { status: 400 }
      )
    }

    // Perform password reset
    const changed = await resetPassword(resetToken, password)
    if (!changed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password reset failed. Token may have expired.',
        },
        { status: 400 }
      )
    }

    // Invalidate the session (mark as used)
    sessionManager.invalidate(resetSessionId)

    return NextResponse.json(
      {
        success: true,
        message: 'Password has been reset successfully. You can now log in.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed',
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireAuth } from '@/lib/auth/session'
import { getUserById, updateUserProfile, changePassword } from '@/lib/admin/user-repository'
import { userUpdateProfileSchema, userChangePasswordSchema } from '@/lib/validations'

/**
 * GET /api/users/me - Get current user profile
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await getUserById(session.userId)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profile',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/me - Update current user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await request.json()

    // Parse request body to determine action
    if (body.action === 'change-password') {
      // Change password
      const validation = userChangePasswordSchema.safeParse(body)
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

      const { currentPassword, newPassword } = validation.data

      const success = await changePassword(session.userId, currentPassword, newPassword)

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Current password is incorrect' },
          { status: 401 }
        )
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Password changed successfully',
        },
        { status: 200 }
      )
    }

    // Update profile
    const validation = userUpdateProfileSchema.safeParse(body)
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

    const { displayName } = validation.data
    const user = await updateUserProfile(
      session.userId,
      displayName || session.displayName
    )

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        user,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update profile error:', error)

    if (error instanceof Error && error.message === 'Unauthorized: No active session') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      },
      { status: 500 }
    )
  }
}

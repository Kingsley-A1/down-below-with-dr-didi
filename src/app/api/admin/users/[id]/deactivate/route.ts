import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { deactivateUser, getUserById } from '@/lib/admin/user-repository'

/**
 * POST /api/admin/users/[id]/deactivate
 * Deactivate a user
 * Admin only
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication and admin role
    const session = await requireAuth()
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const userId = params.id

    // Validate user ID format
    if (!userId || userId.trim() === '') {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Prevent admin from deactivating themselves
    if (userId === session.userId) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already deactivated
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'User is already deactivated' },
        { status: 400 }
      )
    }

    // Deactivate user
    const success = await deactivateUser(userId, session.email)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to deactivate user' },
        { status: 500 }
      )
    }

    // Fetch updated user
    const updatedUser = await getUserById(userId)

    return NextResponse.json(
      {
        success: true,
        message: `User ${user.email} has been deactivated`,
        user: updatedUser,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deactivating user:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate user', details: (error as Error).message },
      { status: 500 }
    )
  }
}

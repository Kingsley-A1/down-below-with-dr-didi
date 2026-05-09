import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { activateUser, getUserById } from '@/lib/admin/user-repository'

/**
 * POST /api/admin/users/[id]/activate
 * Activate a user
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

    // Check if user exists
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already active
    if (user.isActive) {
      return NextResponse.json(
        { error: 'User is already active' },
        { status: 400 }
      )
    }

    // Activate user
    const success = await activateUser(userId, session.email)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to activate user' },
        { status: 500 }
      )
    }

    // Fetch updated user
    const updatedUser = await getUserById(userId)

    return NextResponse.json(
      {
        success: true,
        message: `User ${user.email} has been activated`,
        user: updatedUser,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error activating user:', error)
    return NextResponse.json(
      { error: 'Failed to activate user', details: (error as Error).message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { deactivateUser, getUserById } from '@/lib/admin/user-repository'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { extractClientIP } from '@/lib/security'

/**
 * POST /api/admin/users/[id]/deactivate
 * Deactivate a user (admin only)
 * Logs deactivation action with IP and User-Agent for audit trail
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'super_admin')
  if (roleError) {
    return roleError
  }

  try {
    const { id: userId } = await params

    // Validate user ID format
    if (!userId || userId.trim() === '') {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Check if user exists
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent admin from deactivating themselves.
    if (user.email.trim().toLowerCase() === session.email.trim().toLowerCase()) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      )
    }

    // Check if already deactivated
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'User is already deactivated' },
        { status: 400 }
      )
    }

    // Capture IP and User-Agent for audit trail
    const ipAddress = extractClientIP({
      'x-forwarded-for': request.headers.get('x-forwarded-for') ?? undefined,
      'x-real-ip': request.headers.get('x-real-ip') ?? undefined,
    })
    const userAgent = request.headers.get('user-agent') ?? undefined

    // Deactivate user with audit metadata
    const success = await deactivateUser(userId, session.email, session.role, {
      ipAddress,
      userAgent,
    })

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
    return mapApiError(error, 'Failed to deactivate user')
  }
}

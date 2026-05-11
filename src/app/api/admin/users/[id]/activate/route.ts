import { NextRequest, NextResponse } from 'next/server'
import { activateUser, getUserById } from '@/lib/admin/user-repository'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { extractClientIP } from '@/lib/security'

/**
 * POST /api/admin/users/[id]/activate
 * Activate a user (admin only)
 * Logs activation action with IP and User-Agent for audit trail
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

    // Check if already active
    if (user.isActive) {
      return NextResponse.json(
        { error: 'User is already active' },
        { status: 400 }
      )
    }

    // Capture IP and User-Agent for audit trail
    const ipAddress = extractClientIP({
      'x-forwarded-for': request.headers.get('x-forwarded-for') ?? undefined,
      'x-real-ip': request.headers.get('x-real-ip') ?? undefined,
    })
    const userAgent = request.headers.get('user-agent') ?? undefined

    // Activate user with audit metadata
    const success = await activateUser(userId, session.email, session.role, {
      ipAddress,
      userAgent,
    })

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
    return mapApiError(error, 'Failed to activate user')
  }
}

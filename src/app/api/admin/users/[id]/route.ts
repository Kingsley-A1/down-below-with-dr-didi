import { NextRequest, NextResponse } from 'next/server'
import { getUserById, getUserAuditLogs } from '@/lib/admin/user-repository'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'

/**
 * GET /api/admin/users/[id]
 * Get user details with audit logs
 * Admin only
 */
export async function GET(
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const auditLimit = Math.min(parseInt(searchParams.get('auditLimit') || '50'), 100)

    // Fetch user details
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch audit logs
    const auditLogs = await getUserAuditLogs(userId, auditLimit)

    return NextResponse.json(
      {
        success: true,
        user,
        auditLogs,
      },
      { status: 200 }
    )
  } catch (error) {
    return mapApiError(error, 'Failed to fetch user details')
  }
}

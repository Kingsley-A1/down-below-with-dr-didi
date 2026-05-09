import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getUserById, getUserAuditLogs } from '@/lib/admin/user-repository'

/**
 * GET /api/admin/users/[id]
 * Get user details with audit logs
 * Admin only
 */
export async function GET(
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
    console.error('Error fetching user details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details', details: (error as Error).message },
      { status: 500 }
    )
  }
}

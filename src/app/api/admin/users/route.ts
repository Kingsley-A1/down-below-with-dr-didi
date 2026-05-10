import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { listUsers } from '@/lib/admin/user-repository'

/**
 * GET /api/admin/users
 * List users with DB-level pagination and filtering
 * Filters applied at database level for optimal scalability
 * Admin only
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication and admin role
    const session = await requireAuth()
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100 per request
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined // 'active' or 'inactive'
    const role = searchParams.get('role') || undefined

    // Build filters object for database-level filtering
    const filters = {
      ...(search && { search }),
      ...(status && { status: status as 'active' | 'inactive' }),
      ...(role && { role }),
    }

    // Fetch users with DB-level filtering and pagination
    const result = await listUsers(limit, offset, Object.keys(filters).length > 0 ? filters : undefined)

    return NextResponse.json(
      {
        success: true,
        users: result.users,
        pagination: {
          limit,
          offset,
          total: result.total,
          hasMore: offset + limit < result.total,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error listing users:', error)
    return NextResponse.json(
      { error: 'Failed to list users', details: (error as Error).message },
      { status: 500 }
    )
  }
}

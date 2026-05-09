import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { listUsers } from '@/lib/admin/user-repository'

/**
 * GET /api/admin/users
 * List all users with pagination and filtering
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
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || '' // 'active', 'inactive', or empty for all
    const role = searchParams.get('role') || '' // Filter by role

    // Fetch users
    const result = await listUsers(limit + 100, 0) // Fetch extra for filtering
    let users = result.users

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase()
      users = users.filter(
        (user) =>
          user.email.toLowerCase().includes(searchLower) ||
          user.displayName.toLowerCase().includes(searchLower)
      )
    }

    if (status === 'active') {
      users = users.filter((user) => user.isActive)
    } else if (status === 'inactive') {
      users = users.filter((user) => !user.isActive)
    }

    if (role) {
      users = users.filter((user) => user.role === role)
    }

    // Apply pagination to filtered results
    const total = users.length
    users = users.slice(offset, offset + limit)

    return NextResponse.json(
      {
        success: true,
        users,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total,
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

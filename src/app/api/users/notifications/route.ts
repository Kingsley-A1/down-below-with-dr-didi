import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { listUserNotifications } from '@/lib/admin/repository'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const rawLimit = Number(request.nextUrl.searchParams.get('limit') || '30')
    const take = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100) : 30

    const result = await listUserNotifications(session.userId, { take })

    return NextResponse.json({
      success: true,
      notifications: result.notifications,
      unreadCount: result.unreadCount,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized: No active session') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notifications',
      },
      { status: 500 }
    )
  }
}

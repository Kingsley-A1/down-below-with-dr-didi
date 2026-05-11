import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { markUserNotificationRead } from '@/lib/admin/repository'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    if (!id || !id.trim()) {
      return NextResponse.json({ success: false, error: 'Invalid notification id' }, { status: 400 })
    }

    const notification = await markUserNotificationRead(session.userId, id)

    if (!notification) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized: No active session') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update notification state',
      },
      { status: 500 }
    )
  }
}

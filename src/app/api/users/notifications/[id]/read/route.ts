import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, type UserSession } from '@/lib/auth/session'
import { markUserNotificationRead } from '@/lib/admin/repository'
import { serverError, serviceUnavailable } from '@/lib/api/errors'
import { isTransientPrismaError } from '@/lib/prisma-retry'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session: UserSession | null = null

  try {
    session = await requireAuth()
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

    const context = {
      request,
      error,
      identity: session ? { userId: session.userId, email: session.email, role: session.role } : undefined,
    }

    if (isTransientPrismaError(error)) {
      return serviceUnavailable('database_unavailable', 'Notification state is temporarily unavailable.', {
        ...context,
        action: 'Check database connectivity, then retry marking the notification as read.',
      })
    }

    return serverError('Failed to update notification state', context)
  }
}

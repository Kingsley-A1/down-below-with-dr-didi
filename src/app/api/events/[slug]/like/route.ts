import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import {
  getEventBySlug,
  getEventLikeCount,
  hasUserLikedEvent,
  likeEvent,
  unlikeEvent,
} from '@/lib/events/repository'
import { mapApiError } from '@/lib/admin/api-guard'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await requireAuth()
    const { slug } = await params

    const event = await getEventBySlug(slug)
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (!event.engagementEnabled) {
      return NextResponse.json({ error: 'Engagement is paused for this event' }, { status: 403 })
    }

    await likeEvent(event.id, session.userId)
    const count = await getEventLikeCount(event.id)

    return NextResponse.json({ success: true, liked: true, count })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized: No active session') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return mapApiError(error, 'Failed to like event')
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await requireAuth()
    const { slug } = await params

    const event = await getEventBySlug(slug)
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    await unlikeEvent(event.id, session.userId)
    const count = await getEventLikeCount(event.id)
    const liked = await hasUserLikedEvent(event.id, session.userId)

    return NextResponse.json({ success: true, liked, count })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized: No active session') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return mapApiError(error, 'Failed to remove event like')
  }
}

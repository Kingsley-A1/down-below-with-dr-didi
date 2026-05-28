import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { mapApiError } from '@/lib/admin/api-guard'
import {
  COMMENT_RATE_LIMIT_MAX,
  addComment,
  countRecentUserComments,
  getEventBySlug,
  getVisibleComments,
} from '@/lib/events/repository'
import { eventCommentSchema } from '@/lib/events/schemas'
import { validationError } from '@/lib/api/errors'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const event = await getEventBySlug(slug)

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const comments = await getVisibleComments(event.id)
    return NextResponse.json({ comments })
  } catch (error) {
    return mapApiError(error, 'Failed to fetch comments', { request: _request })
  }
}

export async function POST(
  request: NextRequest,
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
      return NextResponse.json({ error: 'Comments are paused for this event' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = eventCommentSchema.safeParse(body)

    if (!parsed.success) {
      return validationError(parsed.error)
    }

    const recentCommentCount = await countRecentUserComments(event.id, session.userId)
    if (recentCommentCount >= COMMENT_RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: 'You are commenting too quickly. Please wait a minute and try again.' },
        { status: 429 }
      )
    }

    const comment = await addComment(event.id, session.userId, session.displayName, parsed.data.body)

    return NextResponse.json({ success: true, comment }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized: No active session') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return mapApiError(error, 'Failed to add comment', { request })
  }
}

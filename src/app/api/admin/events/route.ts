import { NextRequest, NextResponse } from 'next/server'
import { createEvent, getAllEvents } from '@/lib/admin/repository'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { createEventSchema } from '@/lib/events/schemas'

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'moderator')
  if (roleError) {
    return roleError
  }

  const events = await getAllEvents()
  return NextResponse.json({ events })
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'editor')
  if (roleError) {
    return roleError
  }

  try {
    const body = await request.json()
    const parsed = createEventSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    }

    const {
      body: eventBody,
      coverImageUrl,
      coverImageAlt,
      communityLabel,
      location,
      scheduledAt,
      endedAt,
      streamUrl,
      publishedAt,
      ...rest
    } = parsed.data

    const event = await createEvent(
      {
        ...rest,
        body: eventBody || undefined,
        coverImageUrl: coverImageUrl || undefined,
        coverImageAlt: coverImageAlt || undefined,
        communityLabel: communityLabel || undefined,
        location: location || undefined,
        scheduledAt: scheduledAt || undefined,
        endedAt: endedAt || undefined,
        streamUrl: streamUrl || undefined,
        publishedAt: publishedAt || undefined,
      },
      { email: session.email, role: session.role }
    )

    return NextResponse.json({ success: true, event }, { status: 201 })
  } catch (error) {
    return mapApiError(error, 'Failed to create event')
  }
}

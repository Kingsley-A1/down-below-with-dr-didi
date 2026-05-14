import { NextRequest, NextResponse } from 'next/server'
import { deleteEvent, updateEvent } from '@/lib/admin/repository'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { updateEventSchema } from '@/lib/events/schemas'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'editor')
  if (roleError) {
    return roleError
  }

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = updateEventSchema.safeParse(body)

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

    const event = await updateEvent(
      id,
      {
        ...rest,
        ...(eventBody !== undefined && { body: eventBody || null }),
        ...(coverImageUrl !== undefined && { coverImageUrl: coverImageUrl || null }),
        ...(coverImageAlt !== undefined && { coverImageAlt: coverImageAlt || null }),
        ...(communityLabel !== undefined && { communityLabel: communityLabel || null }),
        ...(location !== undefined && { location: location || null }),
        ...(scheduledAt !== undefined && { scheduledAt: scheduledAt || null }),
        ...(endedAt !== undefined && { endedAt: endedAt || null }),
        ...(streamUrl !== undefined && { streamUrl: streamUrl || null }),
        ...(publishedAt !== undefined && { publishedAt: publishedAt || null }),
      },
      { email: session.email, role: session.role }
    )

    return NextResponse.json({ success: true, event })
  } catch (error) {
    return mapApiError(error, 'Failed to update event')
  }
}

export async function DELETE(
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

  const { id } = await params

  try {
    await deleteEvent(id, { email: session.email, role: session.role })
    return NextResponse.json({ success: true })
  } catch (error) {
    return mapApiError(error, 'Failed to delete event')
  }
}

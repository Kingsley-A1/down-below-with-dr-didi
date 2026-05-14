import { NextRequest, NextResponse } from 'next/server'
import { moderateEventComment } from '@/lib/admin/repository'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { eventCommentModerationSchema } from '@/lib/events/schemas'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'moderator')
  if (roleError) {
    return roleError
  }

    const { id, commentId } = await params

  try {
    const body = await request.json()
    const parsed = eventCommentModerationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    }

    const comment = await moderateEventComment(id, commentId, parsed.data.status, {
      email: session.email,
      role: session.role,
    })

    return NextResponse.json({ success: true, comment })
  } catch (error) {
    return mapApiError(error, 'Failed to moderate event comment')
  }
}

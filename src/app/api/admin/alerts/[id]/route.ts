import { NextRequest, NextResponse } from 'next/server'
import { deleteSiteAlert, updateSiteAlert } from '@/lib/admin/repository'
import { siteAlertUpdateSchema } from '@/lib/validations'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { validationError } from '@/lib/api/errors'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'moderator')
  if (roleError) {
    return roleError
  }

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = siteAlertUpdateSchema.safeParse({ ...body, id })

    if (!parsed.success) {
      return validationError(parsed.error)
    }

    const { startsAt, endsAt, text, speed, durationSeconds, isActive } = parsed.data

    const alert = await updateSiteAlert(
      id,
      {
        ...(text !== undefined && { text }),
        ...(speed !== undefined && { speed }),
        ...(durationSeconds !== undefined && { durationSeconds }),
        ...(isActive !== undefined && { isActive }),
        ...(startsAt ? { startsAt } : {}),
        ...(endsAt !== undefined && { endsAt: endsAt || null }),
      },
      { email: session.email, role: session.role }
    )

    return NextResponse.json({ success: true, alert })
  } catch (error) {
    return mapApiError(error, 'Failed to update alert', { request, identity: { email: session.email, role: session.role } })
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

  const roleError = requireAdminRole(session, 'moderator')
  if (roleError) {
    return roleError
  }

  const { id } = await params

  try {
    await deleteSiteAlert(id, { email: session.email, role: session.role })
    return NextResponse.json({ success: true })
  } catch (error) {
    return mapApiError(error, 'Failed to delete alert', { request, identity: { email: session.email, role: session.role } })
  }
}

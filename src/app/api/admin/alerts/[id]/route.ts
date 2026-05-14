import { NextRequest, NextResponse } from 'next/server'
import { deleteSiteAlert, updateSiteAlert } from '@/lib/admin/repository'
import { siteAlertUpdateSchema } from '@/lib/validations'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'

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
    const parsed = siteAlertUpdateSchema.safeParse({ ...body, id })

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    }

    const { id: _id, startsAt, endsAt, ...rest } = parsed.data

    const alert = await updateSiteAlert(
      id,
      {
        ...rest,
        ...(startsAt ? { startsAt } : {}),
        ...(endsAt !== undefined && { endsAt: endsAt || null }),
      },
      { email: session.email, role: session.role }
    )

    return NextResponse.json({ success: true, alert })
  } catch (error) {
    return mapApiError(error, 'Failed to update alert')
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
    await deleteSiteAlert(id, { email: session.email, role: session.role })
    return NextResponse.json({ success: true })
  } catch (error) {
    return mapApiError(error, 'Failed to delete alert')
  }
}

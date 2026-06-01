import { NextRequest, NextResponse } from 'next/server'
import { updateTeamMember, deleteTeamMember } from '@/lib/admin/repository'
import { teamMemberSchema } from '@/lib/validations'
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
    const parsed = teamMemberSchema.partial().safeParse(body)

    if (!parsed.success) {
      return validationError(parsed.error)
    }

    const { imageUrl, imageAlt, ...rest } = parsed.data

    const member = await updateTeamMember(
      id,
      {
        ...rest,
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(imageAlt !== undefined && { imageAlt: imageAlt || null }),
      },
      { email: session.email, role: session.role }
    )

    return NextResponse.json({ success: true, member })
  } catch (error) {
    return mapApiError(error, 'Failed to update team member', { request, identity: { email: session.email, role: session.role } })
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
    await deleteTeamMember(id, { email: session.email, role: session.role })
    return NextResponse.json({ success: true })
  } catch (error) {
    return mapApiError(error, 'Failed to delete team member', { request, identity: { email: session.email, role: session.role } })
  }
}

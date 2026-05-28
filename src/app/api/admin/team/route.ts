import { NextRequest, NextResponse } from 'next/server'
import { getAllTeamMembers, createTeamMember } from '@/lib/admin/repository'
import { teamMemberSchema } from '@/lib/validations'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { validationError } from '@/lib/api/errors'

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'moderator')
  if (roleError) {
    return roleError
  }

  const members = await getAllTeamMembers()
  return NextResponse.json({ members })
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
    const parsed = teamMemberSchema.safeParse(body)

    if (!parsed.success) {
      return validationError(parsed.error)
    }

    const { imageUrl, imageAlt, status, ...rest } = parsed.data

    const member = await createTeamMember(
      {
        ...rest,
        imageUrl: imageUrl || undefined,
        imageAlt: imageAlt || undefined,
        status: status === 'archived' ? 'published' : status,
      },
      { email: session.email, role: session.role }
    )

    return NextResponse.json({ success: true, member }, { status: 201 })
  } catch (error) {
    return mapApiError(error, 'Failed to create team member', { request, identity: { email: session.email, role: session.role } })
  }
}

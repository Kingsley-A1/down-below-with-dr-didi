import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin/session'
import { updateTeamMember, deleteTeamMember } from '@/lib/admin/repository'
import { teamMemberSchema } from '@/lib/validations'

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  return verifyAdminSession(token)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = teamMemberSchema.partial().safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
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
    const message = error instanceof Error ? error.message : 'Failed to update team member'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    await deleteTeamMember(id, { email: session.email, role: session.role })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete team member'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

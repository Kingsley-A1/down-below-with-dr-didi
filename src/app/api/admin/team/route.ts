import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin/session'
import { getAllTeamMembers, createTeamMember } from '@/lib/admin/repository'
import { teamMemberSchema } from '@/lib/validations'

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  return verifyAdminSession(token)
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const members = await getAllTeamMembers()
  return NextResponse.json({ members })
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = teamMemberSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
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
    const message = error instanceof Error ? error.message : 'Failed to create team member'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

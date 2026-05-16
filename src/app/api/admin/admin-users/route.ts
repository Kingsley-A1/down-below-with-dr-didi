import { NextRequest, NextResponse } from 'next/server'
import { createAdminAccount, listAdminAccounts } from '@/lib/admin/repository'
import { adminAccountCreateSchema } from '@/lib/validations'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'super_admin')
  if (roleError) {
    return roleError
  }

  try {
    const accounts = await listAdminAccounts()
    return NextResponse.json({ accounts })
  } catch (error) {
    return mapApiError(error, 'Failed to list admin accounts')
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'super_admin')
  if (roleError) {
    return roleError
  }

  try {
    const body = await request.json()
    const parsed = adminAccountCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    }

    const account = await createAdminAccount(parsed.data, { email: session.email, role: session.role })
    return NextResponse.json({ success: true, account }, { status: 201 })
  } catch (error) {
    return mapApiError(error, 'Failed to create admin account')
  }
}

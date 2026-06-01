import { NextRequest, NextResponse } from 'next/server'
import { createAdminAccount, listAdminAccounts } from '@/lib/admin/repository'
import { adminAccountCreateSchema } from '@/lib/validations'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { notifyAdminAccountChange } from '@/lib/admin/account-notifications'
import { duplicateEmail, validationError } from '@/lib/api/errors'

function isDuplicateAdminEmailError(error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return (error as { code?: unknown }).code === 'P2002'
  }
  return false
}

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
    return mapApiError(error, 'Failed to list admin accounts', { request, identity: { email: session.email, role: session.role } })
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
      return validationError(parsed.error)
    }

    const account = await createAdminAccount(parsed.data, { email: session.email, role: session.role })
    const notification = await notifyAdminAccountChange({
      action: 'created',
      account,
      actorEmail: session.email,
    })
    return NextResponse.json({ success: true, account, emailSent: notification.ok }, { status: 201 })
  } catch (error) {
    if (isDuplicateAdminEmailError(error)) {
      return duplicateEmail('email')
    }

    return mapApiError(error, 'Failed to create admin account', { request, identity: { email: session.email, role: session.role } })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { listAdminAccounts, updateAdminAccount } from '@/lib/admin/repository'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { conflict, notFound } from '@/lib/api/errors'
import { notifyAdminAccountChange } from '@/lib/admin/account-notifications'

export async function POST(
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
    const accounts = await listAdminAccounts()
    const target = accounts.find((account) => account.id === id)

    if (!target) {
      return notFound('Admin account not found')
    }

    if (target.email === session.email) {
      return conflict('You cannot suspend your own admin account while signed in.')
    }

    if (!target.isActive) {
      return conflict('This admin account is already suspended.')
    }

    const account = await updateAdminAccount(id, { isActive: false }, { email: session.email, role: session.role })
    const notification = await notifyAdminAccountChange({
      action: 'suspended',
      account,
      actorEmail: session.email,
    })

    return NextResponse.json({ success: true, account, emailSent: notification.ok })
  } catch (error) {
    return mapApiError(error, 'Failed to suspend admin account', { request, identity: { email: session.email, role: session.role } })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { deleteAdminAccount, listAdminAccounts, updateAdminAccount } from '@/lib/admin/repository'
import { adminAccountUpdateSchema } from '@/lib/validations'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { duplicateEmail, validationError } from '@/lib/api/errors'

function isDuplicateAdminEmailError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error
    ? (error as { code?: unknown }).code === 'P2002'
    : false
}

export async function PUT(
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
    const body = await request.json()
    const parsed = adminAccountUpdateSchema.safeParse({ ...body, id })

    if (!parsed.success) {
      return validationError(parsed.error)
    }

    const { password } = parsed.data
    const account = await updateAdminAccount(
      id,
      {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.email !== undefined && { email: parsed.data.email }),
        ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
        ...(parsed.data.role !== undefined && { role: parsed.data.role }),
        ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
        ...(password ? { password } : {}),
      },
      { email: session.email, role: session.role }
    )

    return NextResponse.json({ success: true, account })
  } catch (error) {
    if (isDuplicateAdminEmailError(error)) {
      return duplicateEmail('email')
    }

    return mapApiError(error, 'Failed to update admin account', { request, identity: { email: session.email, role: session.role } })
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
    const accounts = await listAdminAccounts()
    const target = accounts.find((account) => account.id === id)

    if (target?.email === session.email) {
      return NextResponse.json({ error: 'You cannot delete your own admin account while signed in.' }, { status: 400 })
    }

    await deleteAdminAccount(id, { email: session.email, role: session.role })
    return NextResponse.json({ success: true })
  } catch (error) {
    return mapApiError(error, 'Failed to delete admin account', { request, identity: { email: session.email, role: session.role } })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { listVaultSubmissions, updateVaultSubmissionModeration } from '@/lib/admin/repository'
import { vaultModerationSchema } from '@/lib/validations'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { canViewVaultIdentity } from '@/lib/admin/rbac'

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'super_admin')
  if (roleError) {
    return roleError
  }

  const includeIdentityParam = request.nextUrl.searchParams.get('includeIdentity')
  const includeIdentity = includeIdentityParam === '1' || includeIdentityParam === 'true'

  if (includeIdentity && !canViewVaultIdentity(session.role)) {
    return NextResponse.json({ error: 'Insufficient permissions to reveal identities.' }, { status: 403 })
  }

  const submissions = await listVaultSubmissions({
    email: session.email,
    role: session.role,
  }, {
    includeIdentity,
  })
  return NextResponse.json({ submissions })
}

export async function PUT(request: NextRequest) {
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
    const parsed = vaultModerationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    }

    const record = await updateVaultSubmissionModeration(parsed.data, {
      email: session.email,
      role: session.role,
    })

    return NextResponse.json({ success: true, submission: record })
  } catch (error) {
    return mapApiError(error, 'Failed to update V-Vault submission')
  }
}

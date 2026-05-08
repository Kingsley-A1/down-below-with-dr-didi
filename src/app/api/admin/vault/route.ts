import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin/session'
import { listVaultSubmissions, updateVaultSubmissionModeration } from '@/lib/admin/repository'
import { vaultModerationSchema } from '@/lib/validations'

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  return verifyAdminSession(token)
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const submissions = await listVaultSubmissions()
  return NextResponse.json({ submissions })
}

export async function PUT(request: NextRequest) {
  const session = await requireAdmin(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const message = error instanceof Error ? error.message : 'Failed to update V-Vault submission'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { canAccessRole, type AdminRole } from '@/lib/admin/rbac'
import { ADMIN_SESSION_COOKIE, verifyAdminSession, type AdminSession } from '@/lib/admin/session'

export async function requireAdminSession(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  return verifyAdminSession(token)
}

export function requireAdminRole(session: AdminSession, requiredRole: AdminRole) {
  if (canAccessRole(session.role, requiredRole)) {
    return null
  }

  return NextResponse.json(
    {
      error: `Insufficient permissions. ${requiredRole} role is required.`,
      requiredRole,
      currentRole: session.role,
    },
    { status: 403 }
  )
}

export function mapApiError(
  error: unknown,
  fallbackMessage: string,
  options?: { notFoundPrefix?: string }
) {
  const message = error instanceof Error ? error.message : fallbackMessage

  if (message === 'Database is not configured' || message === 'Cloudflare R2 is not configured') {
    return NextResponse.json({ error: message }, { status: 503 })
  }

  if ((options?.notFoundPrefix && message.startsWith(options.notFoundPrefix)) || message.endsWith('not found')) {
    return NextResponse.json({ error: message }, { status: 404 })
  }

  if (message.startsWith('Validation failed:')) {
    return NextResponse.json({ error: message.replace('Validation failed: ', '') }, { status: 400 })
  }

  return NextResponse.json({ error: message }, { status: 500 })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hasDatabaseConfig } from '@/lib/env'
import { canAccessRole, type AdminRole } from '@/lib/admin/rbac'
import { ADMIN_SESSION_COOKIE, verifyAdminSession, type AdminSession } from '@/lib/admin/session'

/**
 * Verifies the admin session token (signature + expiry) AND checks the DB
 * for revocation:
 *  - account exists and is active
 *  - emailVerified is true
 *  - tokenVersion in the cookie matches the DB
 *
 * Use this guard in API routes. Middleware (proxy.ts) only does the cheap
 * signature check because it runs in the Edge runtime where Prisma isn't
 * available — meaning a revoked admin can still load admin pages but
 * mutations and data fetches gated by this guard reject immediately.
 */
export async function requireAdminSession(request: NextRequest): Promise<AdminSession | null> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const session = await verifyAdminSession(token)
  if (!session) {
    return null
  }

  // If the DB isn't configured (local dev with no DATABASE_URL), skip the
  // revocation check — the rest of the system already degrades gracefully.
  if (!hasDatabaseConfig()) {
    return session
  }

  try {
    const account = await prisma.adminUser.findUnique({
      where: { email: session.email },
      select: {
        isActive: true,
        emailVerified: true,
        tokenVersion: true,
      },
    })

    if (!account || !account.isActive || !account.emailVerified) {
      return null
    }

    if ((account.tokenVersion ?? 0) !== session.tokenVersion) {
      return null
    }

    return session
  } catch (error) {
    // If the lookup fails (DB outage), refuse rather than allow — admin
    // routes deserve the stricter default.
    console.error('Admin session DB check failed:', error)
    return null
  }
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

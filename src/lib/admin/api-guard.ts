import { NextRequest } from 'next/server'
import { canAccessRole, type AdminRole } from '@/lib/admin/rbac'
import { ADMIN_SESSION_COOKIE, verifyAdminSession, type AdminSession } from '@/lib/admin/session'
import { validateAdminSessionWithDatabase } from '@/lib/admin/session-validation'
import { isAppError } from '@/lib/app-error'
import { conflict, duplicateEmail, forbidden, notFound, serverError, serviceUnavailable, validationFailure } from '@/lib/api/errors'
import type { ApiErrorLogContext } from '@/lib/api/observability'

/**
 * Verifies the admin session token (signature + expiry) AND checks the DB
 * for revocation:
 *  - account exists and is active
 *  - emailVerified is true
 *  - tokenVersion in the cookie matches the DB
 *
 * Use this guard in API routes. Middleware (proxy.ts) only does the cheap
 * signature check because it runs in the Edge runtime where Prisma isn't
 * available. Server-rendered admin pages use the same DB-backed validation via
 * page-guard.ts.
 */
export async function requireAdminSession(request: NextRequest): Promise<AdminSession | null> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const session = await verifyAdminSession(token)
  return validateAdminSessionWithDatabase(session)
}

export function requireAdminRole(session: AdminSession, requiredRole: AdminRole) {
  if (canAccessRole(session.role, requiredRole)) {
    return null
  }

  return forbidden(
    `You need ${requiredRole} access or higher to perform this action.`,
    'Ask a super admin to update your role or sign in with an authorized admin account.'
  )
}

export function mapApiError(
  error: unknown,
  fallbackMessage: string,
  context?: ApiErrorLogContext
) {
  const logContext = { ...context, error }

  if (isAppError(error)) {
    switch (error.code) {
      case 'database_unavailable':
        return serviceUnavailable('database_unavailable', error.message, {
          ...logContext,
          action: 'Check DATABASE_URL, run migrations, and verify the deployment environment variables.',
        })
      case 'storage_unavailable':
        return serviceUnavailable('storage_unavailable', error.message, {
          ...logContext,
          action: 'Check Cloudflare R2 account ID, bucket, access keys, public URL, and CORS settings.',
        })
      case 'not_found':
        return notFound(error.message)
      case 'validation_failed':
        return validationFailure(error.message, error.fieldErrors)
      case 'conflict':
        return conflict(error.message, error.fieldErrors)
      case 'duplicate_email':
        return duplicateEmail('email', error.message)
      case 'permission_denied':
        return forbidden(error.message, error.action)
      default:
        break
    }
  }

  return serverError(fallbackMessage, logContext)
}

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { canAccessRole, type AdminRole } from '@/lib/admin/rbac'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin/session'
import { sanitizeAdminNextPath } from '@/lib/admin/redirects'
import { validateAdminSessionWithDatabase } from '@/lib/admin/session-validation'

type RequireAdminPageSessionOptions = {
  nextPath: string
  requiredRole?: AdminRole
}

export async function requireAdminPageSession(options: RequireAdminPageSessionOptions) {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  const session = await validateAdminSessionWithDatabase(await verifyAdminSession(token))

  if (!session) {
    const signInTarget = `/admin/sign-in?next=${encodeURIComponent(sanitizeAdminNextPath(options.nextPath))}`
    redirect(signInTarget)
  }

  if (options.requiredRole && !canAccessRole(session.role, options.requiredRole)) {
    redirect('/admin')
  }

  return session
}

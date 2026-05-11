import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { canAccessRole, type AdminRole } from '@/lib/admin/rbac'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin/session'

type RequireAdminPageSessionOptions = {
  nextPath: string
  requiredRole?: AdminRole
}

export async function requireAdminPageSession(options: RequireAdminPageSessionOptions) {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  const session = await verifyAdminSession(token)

  if (!session) {
    const signInTarget = `/admin/sign-in?next=${encodeURIComponent(options.nextPath)}`
    redirect(signInTarget)
  }

  if (options.requiredRole && !canAccessRole(session.role, options.requiredRole)) {
    redirect('/admin')
  }

  return session
}
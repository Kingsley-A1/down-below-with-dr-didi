import { cookies } from 'next/headers'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin/session'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers()
  const pathname = headerStore.get('x-admin-pathname')
  const isSignInRoute = pathname === '/admin/sign-in'

  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  const session = await verifyAdminSession(token)

  if (!session && !isSignInRoute) {
    redirect('/admin/sign-in')
  }

  if (session && isSignInRoute) {
    redirect('/admin')
  }

  if (!session) {
    return <>{children}</>
  }

  return (
    <AdminShell email={session.email} role={session.role}>
      {children}
    </AdminShell>
  )
}
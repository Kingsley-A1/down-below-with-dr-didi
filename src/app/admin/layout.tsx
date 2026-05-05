import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin/session'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  const session = await verifyAdminSession(token)

  if (!session) {
    redirect('/admin/sign-in')
  }

  return (
    <AdminShell email={session.email} role={session.role}>
      {children}
    </AdminShell>
  )
}
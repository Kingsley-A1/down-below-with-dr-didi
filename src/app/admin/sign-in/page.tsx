import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminSignInForm from '@/components/admin/AdminSignInForm'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin/session'
import { validateAdminSessionWithDatabase } from '@/lib/admin/session-validation'

export const metadata: Metadata = {
  title: 'Admin Sign In',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminSignInPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  const session = await validateAdminSessionWithDatabase(await verifyAdminSession(token))

  if (session) {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen px-4 pb-12 pt-10 md:px-6 md:pb-16 md:pt-14" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="mx-auto w-full max-w-xl overflow-hidden rounded-[28px] border bg-white" style={{ borderColor: 'var(--color-border)', boxShadow: '0 8px 22px rgba(2, 12, 27, 0.045)' }}>
        <div className="border-b px-8 py-7" style={{ borderColor: 'rgba(11, 78, 65, 0.14)', background: 'linear-gradient(120deg, rgba(11,78,65,0.06), rgba(255,255,255,0.96))' }}>
          <p className="font-body text-xs uppercase tracking-[0.25em] text-emerald-700">Protected Access</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-slate-900 md:text-4xl">Admin sign in</h1>
          <p className="mt-2 font-body text-sm text-slate-600">Use your registered admin email and password to continue.</p>
        </div>

        <div className="space-y-6 px-8 py-8">
          <AdminSignInForm />
          <p className="font-body text-sm text-slate-600">
            New here?{' '}
            <Link href="/admin/register" className="font-semibold text-slate-900 underline decoration-emerald-500 decoration-2 underline-offset-4">
              Create an admin account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

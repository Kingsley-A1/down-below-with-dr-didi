import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminRegisterForm from '@/components/admin/AdminRegisterForm'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin/session'
import { validateAdminSessionWithDatabase } from '@/lib/admin/session-validation'

export const metadata: Metadata = {
  title: 'Admin Registration',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminRegisterPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  const session = await validateAdminSessionWithDatabase(await verifyAdminSession(token))

  if (session) {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen px-4 py-10 md:px-6 md:py-14" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-[28px] border bg-white" style={{ borderColor: 'var(--color-border)', boxShadow: '0 12px 30px rgba(2, 12, 27, 0.08)' }}>
        <div className="border-b px-8 py-7" style={{ borderColor: 'rgba(11, 78, 65, 0.14)', background: 'linear-gradient(120deg, rgba(11,78,65,0.06), rgba(255,255,255,0.96))' }}>
          <p className="font-body text-xs uppercase tracking-[0.25em] text-emerald-700">Role-Code Onboarding</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-slate-900 md:text-4xl">Create Admin Account</h1>
          <p className="mt-2 font-body text-sm text-slate-600">
            Enter your details, create a secure password, and provide your 6-digit role access code from leadership.
          </p>
        </div>

        <div className="space-y-6 px-8 py-8">
          <AdminRegisterForm />
          <p className="font-body text-sm text-slate-600">
            Already registered?{' '}
            <Link href="/admin/sign-in" className="font-semibold text-slate-900 underline decoration-emerald-500 decoration-2 underline-offset-4">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

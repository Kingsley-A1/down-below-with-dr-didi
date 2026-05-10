import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminSignInForm from '@/components/admin/AdminSignInForm'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin/session'

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
  const session = await verifyAdminSession(token)

  if (session) {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="w-full max-w-lg bg-white rounded-[28px] border p-8" style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
        <div className="mb-8">
          <p className="font-body text-xs uppercase tracking-[0.25em] text-gray-400 mb-3">Protected Access</p>
          <h1 className="font-heading text-4xl font-bold mb-3" style={{ color: 'var(--color-primary)' }}>Admin sign in</h1>
          <p className="font-body text-sm text-gray-600">Use an allowlisted email and the shared admin access code to open the production control plane.</p>
        </div>
        <AdminSignInForm />
      </div>
    </div>
  )
}
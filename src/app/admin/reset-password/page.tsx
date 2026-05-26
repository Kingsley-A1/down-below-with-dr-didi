import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { AdminResetPasswordForm } from '@/components/admin/AdminResetPasswordForm'

export const metadata: Metadata = {
  title: 'Set New Admin Password',
  robots: { index: false, follow: false },
}

export default function AdminResetPasswordPage() {
  return (
    <div className="min-h-screen px-4 pb-12 pt-10 md:px-6 md:pb-16 md:pt-14" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="mx-auto w-full max-w-xl overflow-hidden rounded-[28px] border bg-white" style={{ borderColor: 'var(--color-border)', boxShadow: '0 8px 22px rgba(2, 12, 27, 0.045)' }}>
        <div className="border-b px-8 py-7" style={{ borderColor: 'rgba(11, 78, 65, 0.14)', background: 'linear-gradient(120deg, rgba(11,78,65,0.06), rgba(255,255,255,0.96))' }}>
          <p className="font-body text-xs uppercase tracking-[0.25em] text-emerald-700">Set new password</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-slate-900 md:text-4xl">Choose a new admin password</h1>
        </div>
        <div className="space-y-6 px-8 py-8">
          <Suspense fallback={<p className="font-body text-sm text-slate-500">Loading…</p>}>
            <AdminResetPasswordForm />
          </Suspense>
          <p className="font-body text-sm text-slate-600">
            <Link href="/admin/sign-in" className="font-semibold text-slate-900 underline decoration-emerald-500 decoration-2 underline-offset-4">
              Back to admin sign-in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { AdminVerifyEmailForm } from '@/components/admin/AdminVerifyEmailForm'

export const metadata: Metadata = {
  title: 'Verify Admin Email',
  robots: { index: false, follow: false },
}

export default function AdminVerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="w-full max-w-md border-t-2 border-emerald-600 bg-white px-8 py-10" style={{ boxShadow: '0 1px 0 rgba(2, 12, 27, 0.04)' }}>
        <header>
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">Admin · email verification</p>
          <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Verify your admin email</h1>
          <p className="mt-2 font-body text-sm leading-relaxed text-slate-600">Enter the 6-digit code we emailed you to activate your admin access.</p>
        </header>
        <div className="mt-7">
          <Suspense fallback={<p className="font-body text-sm text-slate-500">Loading…</p>}>
            <AdminVerifyEmailForm />
          </Suspense>
          <p className="mt-6 border-t border-slate-100 pt-4 font-body text-sm text-slate-600">
            Already verified?{' '}
            <Link href="/admin/sign-in" className="font-semibold text-slate-900 underline decoration-emerald-500 decoration-2 underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

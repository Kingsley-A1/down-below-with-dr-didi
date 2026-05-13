import type { Metadata } from 'next'
import AdminRecoveryForm from '@/components/admin/AdminRecoveryForm'
import { env } from '@/lib/env'

export const metadata: Metadata = {
  title: 'Admin Account Recovery',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminRecoveryPage() {
  return (
    <div className="min-h-screen px-4 py-10 md:px-6 md:py-14" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div
        className="mx-auto w-full max-w-2xl overflow-hidden rounded-[28px] border bg-white"
        style={{ borderColor: 'var(--color-border)', boxShadow: '0 12px 30px rgba(2, 12, 27, 0.08)' }}
      >
        <div
          className="border-b px-8 py-7"
          style={{ borderColor: 'rgba(11, 78, 65, 0.14)', background: 'linear-gradient(120deg, rgba(11,78,65,0.06), rgba(255,255,255,0.96))' }}
        >
          <p className="font-body text-xs uppercase tracking-[0.25em] text-emerald-700">Self-Service Recovery</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-slate-900 md:text-4xl">Recover Admin Account</h1>
          <p className="mt-2 font-body text-sm text-slate-600">
            Use your admin email, desired password, and valid role access code to repair access and retry sign in.
          </p>
        </div>

        <div className="space-y-6 px-8 py-8">
          <AdminRecoveryForm supportPhone={env.ADMIN_SUPPORT_PHONE} />
        </div>
      </div>
    </div>
  )
}
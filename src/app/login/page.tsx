import Link from 'next/link'
import AuthLegalLinks from '@/components/auth/AuthLegalLinks'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <main className="min-h-screen px-4 pb-12 pt-24 md:px-6 md:pb-16 md:pt-28" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div
        className="mx-auto w-full max-w-xl overflow-hidden rounded-[28px] border bg-white"
        style={{ borderColor: 'var(--color-border)', boxShadow: '0 8px 22px rgba(2, 12, 27, 0.045)' }}
      >
        <div
          className="border-b px-8 py-7"
          style={{ borderColor: 'rgba(11, 78, 65, 0.14)', background: 'linear-gradient(120deg, rgba(11,78,65,0.06), rgba(255,255,255,0.96))' }}
        >
          <p className="font-body text-xs uppercase tracking-[0.25em] text-emerald-700">Member Access</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-slate-900 md:text-4xl">Welcome back</h1>
          <p className="mt-2 font-body text-sm text-slate-600">
            Sign in to continue your private health journey and access your V-Vault inbox.
          </p>
        </div>

        <div className="space-y-6 px-8 py-8">
          <LoginForm />
          <p className="font-body text-sm text-slate-600">
            New here?{' '}
            <Link
              href="/register"
              className="font-semibold text-slate-900 underline decoration-emerald-500 decoration-2 underline-offset-4"
            >
              Create your account
            </Link>
          </p>
          <AuthLegalLinks />
        </div>
      </div>
    </main>
  )
}

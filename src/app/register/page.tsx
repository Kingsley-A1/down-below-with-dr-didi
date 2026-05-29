import AuthLegalLinks from '@/components/auth/AuthLegalLinks'
import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <main className="min-h-screen px-4 py-10 md:px-6 md:py-14" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div
        className="mx-auto w-full max-w-2xl overflow-hidden rounded-[28px] border bg-white"
        style={{ borderColor: 'var(--color-border)', boxShadow: '0 12px 30px rgba(2, 12, 27, 0.08)' }}
      >
        <div
          className="border-b px-8 py-7"
          style={{ borderColor: 'rgba(11, 78, 65, 0.14)', background: 'linear-gradient(120deg, rgba(11,78,65,0.06), rgba(255,255,255,0.96))' }}
        >
          <p className="font-body text-xs uppercase tracking-[0.25em] text-emerald-700">Community Onboarding</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-slate-900 md:text-4xl">Create your account</h1>
          <p className="mt-2 font-body text-sm text-slate-600">
            Join Down Below with Dr. Didi for private support, trusted resources, and personalized follow-up.
          </p>
        </div>

        <div className="space-y-6 px-8 py-8">
          <RegisterForm />
          <AuthLegalLinks />
        </div>
      </div>
    </main>
  )
}

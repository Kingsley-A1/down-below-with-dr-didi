import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getUserById } from '@/lib/admin/user-repository'
import { ProfileForm } from '@/components/auth/ProfileForm'

export default async function MePage() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const user = await getUserById(session.userId)

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen px-4 py-10 md:px-6 md:py-14" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <section
          className="overflow-hidden rounded-[28px] border bg-white"
          style={{ borderColor: 'var(--color-border)', boxShadow: '0 12px 30px rgba(2, 12, 27, 0.08)' }}
        >
          <div
            className="border-b px-6 py-6 md:px-8"
            style={{ borderColor: 'rgba(11, 78, 65, 0.14)', background: 'linear-gradient(120deg, rgba(11,78,65,0.06), rgba(255,255,255,0.96))' }}
          >
            <p className="font-body text-xs uppercase tracking-[0.25em] text-emerald-700">Member Hub</p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-slate-900 md:text-4xl">
              My Account Center
            </h1>
            <p className="mt-2 max-w-2xl font-body text-sm text-slate-600">
              Manage your profile, security settings, and private V-Vault activity from one professional dashboard.
            </p>
          </div>
          <div className="px-6 py-6 md:px-8">
            <ProfileForm initialUser={user} />
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 md:p-6" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-body text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Privacy Promise</h2>
          <p className="mt-2 font-body text-sm leading-relaxed text-slate-600">
            Your V-Vault submissions remain anonymous to public audiences. Account linkage is used internally only to deliver your private responses securely.
          </p>
        </section>
      </div>
    </main>
  )
}

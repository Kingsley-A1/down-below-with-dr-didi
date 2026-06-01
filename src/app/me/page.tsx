import { redirect } from 'next/navigation'
import Link from 'next/link'
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
    <section className="min-h-screen px-3 pb-10 pt-24 sm:px-4 md:px-6 md:pb-14 md:pt-28" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="mx-auto w-full max-w-container space-y-5">
        <header className="border-b pb-4" style={{ borderColor: 'rgba(11, 78, 65, 0.14)' }}>
          <p className="font-body text-xs uppercase tracking-[0.22em] text-emerald-700">Member Hub</p>
          <h1 className="mt-1 font-heading text-3xl font-bold text-slate-900 md:text-4xl">
            My Account Center
          </h1>
          <p className="mt-2 max-w-3xl font-body text-sm leading-6 text-slate-600">
            Manage your profile, security settings, and private V-Vault activity.
          </p>
        </header>

        <ProfileForm initialUser={user} />

        <section className="border-t py-4" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-body text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Privacy Promise</h2>
          <p className="mt-2 max-w-4xl font-body text-sm leading-relaxed text-slate-600">
            Your V-Vault submissions remain anonymous to public audiences. Account linkage is used internally only to deliver your private responses securely.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 font-body text-sm">
            <Link href="/privacy" className="font-semibold text-slate-900 underline decoration-emerald-500 decoration-2 underline-offset-4">
              Privacy Policy
            </Link>
            <Link href="/terms" className="font-semibold text-slate-900 underline decoration-emerald-500 decoration-2 underline-offset-4">
              Terms of Use
            </Link>
          </div>
        </section>
      </div>
    </section>
  )
}

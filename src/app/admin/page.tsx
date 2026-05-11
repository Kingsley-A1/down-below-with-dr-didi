import Link from 'next/link'
import AdminDashboardCards from '@/components/admin/AdminDashboardCards'
import { getDashboardSummary } from '@/lib/admin/repository'
import { requireAdminPageSession } from '@/lib/admin/page-guard'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  await requireAdminPageSession({ nextPath: '/admin' })
  const summary = await getDashboardSummary()

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_6px_18px_rgba(2,12,27,0.06)]">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-56 bg-linear-to-l from-emerald-100/60 to-transparent" />
        <p className="relative z-10 font-body text-xs uppercase tracking-[0.28em] text-emerald-700">Control Plane</p>
        <h1 className="relative z-10 mt-2 font-heading text-3xl font-bold text-slate-900">Admin Operations Hub</h1>
        <p className="relative z-10 mt-3 max-w-3xl font-body text-sm text-slate-600">
          One compact command center for settings, publishing modules, moderation queues, and governance signals. Every card opens a focused modal so operators can move from overview to action without losing context.
        </p>

        <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-body text-xs uppercase tracking-[0.18em] text-emerald-700">Database</p>
            <p className="mt-1 font-heading text-2xl font-bold text-emerald-900">
              {summary.databaseReady ? 'Connected' : 'Offline'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-body text-xs uppercase tracking-[0.18em] text-slate-600">Admin users</p>
            <p className="mt-1 font-heading text-2xl font-bold text-slate-900">{summary.adminUsers}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-body text-xs uppercase tracking-[0.18em] text-slate-600">Platform users</p>
            <p className="mt-1 font-heading text-2xl font-bold text-slate-900">{summary.platformUsers}</p>
          </div>
        </div>
      </section>

      <AdminDashboardCards summary={summary} />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_6px_18px_rgba(2,12,27,0.06)]">
          <h2 className="font-heading text-2xl font-bold text-slate-900">Readiness checkpoint</h2>
          <p className="mt-3 font-body text-sm text-slate-600">
            {summary.databaseReady
              ? 'CockroachDB is available, so all admin modules are running with persistent state.'
              : 'Database is not configured in this environment. Set DATABASE_URL and DIRECT_URL before launch validation.'}
          </p>
          <p className="mt-3 font-body text-sm text-slate-600">
            Total editorial modules online: <span className="font-semibold text-slate-900">8</span>
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_6px_18px_rgba(2,12,27,0.06)]">
          <h2 className="font-heading text-2xl font-bold text-slate-900">Direct actions</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/admin/settings"
              className="rounded-full bg-slate-900 px-4 py-2 font-body text-sm font-semibold text-white"
            >
              Open site settings
            </Link>
            <Link
              href="/admin/media"
              className="rounded-full border border-slate-300 px-4 py-2 font-body text-sm font-semibold text-slate-700"
            >
              Open media library
            </Link>
            <Link
              href="/admin/alerts"
              className="rounded-full border border-slate-300 px-4 py-2 font-body text-sm font-semibold text-slate-700"
            >
              Open site alerts
            </Link>
            <Link
              href="/admin/register"
              className="rounded-full border border-slate-300 px-4 py-2 font-body text-sm font-semibold text-slate-700"
            >
              Admin registration
            </Link>
          </div>
          <p className="mt-3 font-body text-sm text-slate-600">
            Keep one operator on each module during launch week to shorten triage loops.
          </p>
        </article>
      </section>
    </div>
  )
}

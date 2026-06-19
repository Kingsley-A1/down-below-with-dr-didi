import Link from 'next/link'
import { Activity, AlertTriangle, CheckCircle2, CircleDashed, Database, HardDrive, Mail, Server, Shield } from 'lucide-react'
import AdminContentContainer from '@/components/admin/AdminContentContainer'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { getAdminHealthSnapshot, type HealthStatus, type RouteHealth } from '@/lib/admin/health'
import { requireAdminPageSession } from '@/lib/admin/page-guard'
import { createRequestId } from '@/lib/api/observability'

export const dynamic = 'force-dynamic'

const STATUS_CLASSNAME: Record<HealthStatus, string> = {
  operational: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  degraded: 'border-amber-200 bg-amber-50 text-amber-800',
  blocked: 'border-rose-200 bg-rose-50 text-rose-800',
}

const STATUS_ICON = {
  operational: CheckCircle2,
  degraded: AlertTriangle,
  blocked: CircleDashed,
} satisfies Record<HealthStatus, React.ComponentType<{ className?: string }>>

const LAYER_LABEL: Record<RouteHealth['layer'], string> = {
  public_page: 'Public pages',
  admin_page: 'Admin pages',
  api_route: 'API routes',
}

const HEALTH_SCORE_CLASSNAME: Record<HealthStatus, string> = {
  operational: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  degraded: 'border-amber-200 bg-amber-50 text-amber-800',
  blocked: 'border-rose-200 bg-rose-50 text-rose-800',
}

function scoreStatus(status: HealthStatus) {
  if (status === 'operational') {
    return 1
  }

  if (status === 'degraded') {
    return 0.55
  }

  return 0
}

function averageHealthScore(statuses: HealthStatus[]) {
  if (statuses.length === 0) {
    return 1
  }

  return statuses.reduce((total, status) => total + scoreStatus(status), 0) / statuses.length
}

function calculateHealthPercentage(snapshot: Awaited<ReturnType<typeof getAdminHealthSnapshot>>) {
  const dependencyScore = averageHealthScore(snapshot.dependencies.map((dependency) => dependency.status))
  const routeScore = averageHealthScore(snapshot.routes.map((route) => route.status))
  const tableScore = averageHealthScore(snapshot.tables.map((table) => table.status))

  return Math.round(((dependencyScore * 0.4) + (routeScore * 0.35) + (tableScore * 0.25)) * 100)
}

function statusFromPercentage(percentage: number): HealthStatus {
  if (percentage >= 90) {
    return 'operational'
  }

  if (percentage >= 60) {
    return 'degraded'
  }

  return 'blocked'
}

function StatusBadge({ status }: { status: HealthStatus }) {
  const Icon = STATUS_ICON[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-body text-xs font-semibold capitalize ${STATUS_CLASSNAME[status]}`}>
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  )
}

function HealthScoreCard({
  percentage,
  status,
  blockedRoutes,
  degradedRoutes,
}: {
  percentage: number
  status: HealthStatus
  blockedRoutes: number
  degradedRoutes: number
}) {
  return (
    <section className={`rounded-2xl border p-5 shadow-sm ${HEALTH_SCORE_CLASSNAME[status]}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] opacity-75">Platform health score</p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <p className="font-heading text-5xl font-bold leading-none text-slate-950">{percentage}%</p>
            <StatusBadge status={status} />
          </div>
          <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-slate-700">
            Weighted from core dependencies, route readiness, and database model probes. Degraded public fallbacks count as partial availability, while blocked admin or API dependencies reduce the score sharply.
          </p>
        </div>

        <div className="min-w-0 rounded-xl border border-white/70 bg-white/70 p-4 text-slate-800 shadow-sm lg:min-w-72">
          <div className="flex items-center justify-between gap-4 font-body text-sm">
            <span className="font-semibold">Blocked routes</span>
            <span className="font-heading text-2xl font-bold">{blockedRoutes}</span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-4 font-body text-sm">
            <span className="font-semibold">Degraded routes</span>
            <span className="font-heading text-2xl font-bold">{degradedRoutes}</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function SummaryCard({
  title,
  value,
  status,
  icon: Icon,
  detail,
}: {
  title: string
  value: string
  status: HealthStatus
  icon: React.ComponentType<{ className?: string }>
  detail: string
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-2 font-heading text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <span className="rounded-xl bg-slate-50 p-2 text-slate-700">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-4">
        <StatusBadge status={status} />
      </div>
      <p className="mt-3 font-body text-sm leading-relaxed text-slate-600">{detail}</p>
    </article>
  )
}

function statusFromBoolean(value: boolean, degradedWhenFalse = false): HealthStatus {
  if (value) {
    return 'operational'
  }

  return degradedWhenFalse ? 'degraded' : 'blocked'
}

function RouteTable({ title, routes }: { title: string; routes: RouteHealth[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-heading text-xl font-bold text-slate-900">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left font-body text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="whitespace-nowrap border-b border-slate-200 px-3 py-2">Route</th>
              <th className="whitespace-nowrap border-b border-slate-200 px-3 py-2">Status</th>
              <th className="whitespace-nowrap border-b border-slate-200 px-3 py-2">Depends on</th>
              <th className="border-b border-slate-200 px-3 py-2">Cause</th>
              <th className="border-b border-slate-200 px-3 py-2">Operator action</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <tr key={`${route.layer}:${route.route}`} className="align-top">
                <td className="border-b border-slate-100 px-3 py-3">
                  <p className="font-semibold text-slate-900">{route.name}</p>
                  <p className="mt-1 max-w-xs text-xs text-slate-500">{route.route}</p>
                  <p className="mt-1 text-xs text-slate-400">{route.methods.join(', ')}</p>
                </td>
                <td className="border-b border-slate-100 px-3 py-3">
                  <StatusBadge status={route.status} />
                </td>
                <td className="border-b border-slate-100 px-3 py-3">
                  <p className="capitalize text-slate-700">
                    {route.dependencies.length > 0 ? route.dependencies.join(', ').replaceAll('_', ' ') : 'Static/render-only'}
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-slate-500">
                    {route.dataModels.length > 0 ? route.dataModels.join(', ') : 'No database model'}
                  </p>
                </td>
                <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{route.reason}</td>
                <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{route.operatorAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default async function AdminHealthPage() {
  await requireAdminPageSession({ nextPath: '/admin/health', requiredRole: 'super_admin' })
  const snapshot = await getAdminHealthSnapshot({ requestId: createRequestId() })
  const blockedRoutes = snapshot.routes.filter((route) => route.status === 'blocked').length
  const degradedRoutes = snapshot.routes.filter((route) => route.status === 'degraded').length
  const routeStatus: HealthStatus = blockedRoutes > 0 ? 'blocked' : degradedRoutes > 0 ? 'degraded' : 'operational'
  const healthPercentage = calculateHealthPercentage(snapshot)
  const healthStatus = statusFromPercentage(healthPercentage)

  return (
    <AdminContentContainer>
      <AdminPageHeader
        eyebrow="Operations"
        title="Platform Health"
        description="Trace database, email, media, admin auth, and route-level readiness from one operator view."
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Reference ID</p>
            <p className="mt-1 font-mono text-sm text-slate-800">{snapshot.requestId}</p>
            <p className="mt-1 font-body text-xs text-slate-500">Checked {new Date(snapshot.timestamp).toLocaleString('en-NG')}</p>
          </div>
          <Link
            href="/admin/health"
            className="admin-interactive inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 font-body text-sm font-semibold text-white"
          >
            Refresh health snapshot
          </Link>
        </div>
      </section>

      <HealthScoreCard
        percentage={healthPercentage}
        status={healthStatus}
        blockedRoutes={blockedRoutes}
        degradedRoutes={degradedRoutes}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Database"
          value={snapshot.database.reachable ? 'Reachable' : 'Blocked'}
          status={statusFromBoolean(snapshot.database.configured && snapshot.database.reachable)}
          icon={Database}
          detail={snapshot.database.reachable ? 'Prisma can query required tables.' : 'Database-dependent routes will fail until configuration, connectivity, or migrations are fixed.'}
        />
        <SummaryCard
          title="API surface"
          value={`${snapshot.routes.length} mapped`}
          status={routeStatus}
          icon={Server}
          detail={`${blockedRoutes} blocked and ${degradedRoutes} degraded route groups detected from dependency checks.`}
        />
        <SummaryCard
          title="Email"
          value={snapshot.email.configured ? 'Configured' : 'Missing'}
          status={statusFromBoolean(snapshot.email.configured, true)}
          icon={Mail}
          detail={snapshot.email.configured ? 'Transactional email can be sent through Resend.' : 'Password reset, verification, and notification flows are degraded.'}
        />
        <SummaryCard
          title="Media storage"
          value={snapshot.storage.configured ? 'Configured' : 'Missing'}
          status={statusFromBoolean(snapshot.storage.configured, true)}
          icon={HardDrive}
          detail={snapshot.storage.configured ? 'Cloudflare R2 environment variables are present.' : 'Media upload and presign flows are degraded.'}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-slate-900">Core Dependencies</h2>
          <div className="mt-4 space-y-3">
            {snapshot.dependencies.map((dependency) => (
              <div key={dependency.key} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-body text-sm font-semibold text-slate-900">{dependency.label}</p>
                  <StatusBadge status={dependency.status} />
                </div>
                <p className="mt-2 font-body text-sm text-slate-600">{dependency.reason}</p>
                <p className="mt-1 font-body text-xs text-slate-500">{dependency.operatorAction}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-700" />
            <h2 className="font-heading text-xl font-bold text-slate-900">Admin Governance</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ['Admin accounts', snapshot.adminUsers.total],
              ['Active admins', snapshot.adminUsers.active],
              ['Unverified admins', snapshot.adminUsers.unverified],
              ['Locked admins', snapshot.adminUsers.locked],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                <p className="mt-2 font-heading text-2xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 font-body text-sm text-slate-600">
            Admin pages and APIs require a valid DB-backed session. If this page loads but another admin route fails, compare that route&apos;s data model probes below.
          </p>
        </article>
      </section>

      {(['public_page', 'admin_page', 'api_route'] as const).map((layer) => (
        <RouteTable
          key={layer}
          title={LAYER_LABEL[layer]}
          routes={snapshot.routes.filter((route) => route.layer === layer)}
        />
      ))}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-700" />
          <h2 className="font-heading text-xl font-bold text-slate-900">Database Model Probes</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.tables.map((table) => (
            <article key={table.key} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-body text-sm font-semibold text-slate-900">{table.label}</p>
                  <p className="font-mono text-xs text-slate-500">{table.model}</p>
                </div>
                <StatusBadge status={table.status} />
              </div>
              <p className="mt-3 font-heading text-2xl font-bold text-slate-900">{table.count ?? 'N/A'}</p>
              <p className="mt-1 font-body text-xs text-slate-500">{table.reason}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-xl font-bold text-slate-900">Error Reference</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left font-body text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="border-b border-slate-200 px-3 py-2">Code</th>
                <th className="border-b border-slate-200 px-3 py-2">Meaning</th>
                <th className="border-b border-slate-200 px-3 py-2">Operator action</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.errorReference.map((item) => (
                <tr key={item.code} className="align-top">
                  <td className="border-b border-slate-100 px-3 py-3 font-mono text-xs text-slate-700">{item.code}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{item.meaning}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{item.operatorAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminContentContainer>
  )
}

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

function StatusBadge({ status }: { status: HealthStatus }) {
  const Icon = STATUS_ICON[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-body text-xs font-semibold capitalize ${STATUS_CLASSNAME[status]}`}>
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
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

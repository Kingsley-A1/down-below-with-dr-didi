import Link from 'next/link'
import { getDashboardSummary } from '@/lib/admin/repository'

export const dynamic = 'force-dynamic'

const cards: Array<{ key: keyof Awaited<ReturnType<typeof getDashboardSummary>>; label: string }> = [
  { key: 'adminUsers', label: 'Admin users' },
  { key: 'mediaAssets', label: 'Media assets' },
  { key: 'auditLogs', label: 'Audit logs' },
  { key: 'vaultSubmissions', label: 'V-Vault submissions' },
]

export default async function AdminDashboardPage() {
  const summary = await getDashboardSummary()

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--color-border)' }}>
        <h1 className="font-heading text-3xl font-bold mb-3" style={{ color: 'var(--color-primary)' }}>Foundation Dashboard</h1>
        <p className="font-body text-sm text-gray-600 max-w-3xl">
          This admin surface is the Phase 1 and Phase 2 control plane for production hardening. It protects admin access, centralizes site settings, and anchors the CockroachDB plus R2 migration path.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.key} className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--color-border)' }}>
            <p className="font-body text-sm text-gray-500 mb-2">{card.label}</p>
            <p className="font-heading text-4xl font-bold" style={{ color: 'var(--color-primary)' }}>{summary[card.key]}</p>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-2xl border p-6 space-y-4" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="font-heading text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>Readiness Status</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-primary-muted)' }}>
            <p className="font-body text-sm font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>Database layer</p>
            <p className="font-body text-sm text-gray-600">{summary.databaseReady ? 'CockroachDB connection is configured for this environment.' : 'Database env is not configured yet. Add DATABASE_URL and DIRECT_URL to activate persistence.'}</p>
          </div>
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-primary-muted)' }}>
            <p className="font-body text-sm font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>Next steps</p>
            <p className="font-body text-sm text-gray-600">Seed the database, upload the first hero asset, then replace placeholder contact values inside Site Settings.</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Link href="/admin/settings" className="bg-white rounded-2xl border p-6 block" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-heading text-2xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>Manage Site Settings</h2>
          <p className="font-body text-sm text-gray-600">Update brand copy, public contact channels, hero defaults, and global metadata assumptions without editing source files.</p>
        </Link>
        <Link href="/admin/media" className="bg-white rounded-2xl border p-6 block" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-heading text-2xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>Manage Media Assets</h2>
          <p className="font-body text-sm text-gray-600">Upload hero images and reusable media into Cloudflare R2 while writing structured asset records to CockroachDB.</p>
        </Link>
      </section>
    </div>
  )
}
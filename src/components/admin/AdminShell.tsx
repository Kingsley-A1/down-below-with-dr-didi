import Link from 'next/link'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'
import type { AdminRole } from '@/lib/admin/rbac'

const adminLinks = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/settings', label: 'Site Settings' },
  { href: '/admin/media', label: 'Media Library' },
]

export default function AdminShell({
  children,
  email,
  role,
}: {
  children: React.ReactNode
  email: string
  role: AdminRole
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface)' }}>
      <header className="border-b bg-white" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-container mx-auto px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-heading text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
              Admin Console
            </p>
            <p className="font-body text-sm text-gray-500">Production settings, assets, and governance for Down Below Family.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-body text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>{email}</p>
              <p className="font-body text-xs uppercase tracking-[0.2em] text-gray-400">{role.replace('_', ' ')}</p>
            </div>
            <AdminSignOutButton />
          </div>
        </div>
      </header>
      <div className="max-w-container mx-auto px-6 py-8 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="bg-white rounded-2xl border p-4 h-fit" style={{ borderColor: 'var(--color-border)' }}>
          <nav className="space-y-2" aria-label="Admin navigation">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-xl px-4 py-3 font-body text-sm font-semibold transition-colors"
                style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  )
}
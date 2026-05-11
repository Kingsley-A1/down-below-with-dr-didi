import SiteSettingsForm from '@/components/admin/SiteSettingsForm'
import { getSiteSettings } from '@/lib/admin/repository'
import { requireAdminPageSession } from '@/lib/admin/page-guard'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  await requireAdminPageSession({ nextPath: '/admin/settings', requiredRole: 'super_admin' })
  const settings = await getSiteSettings()

  return (
    <section className="bg-white rounded-2xl border border-border border-t-4 border-t-[var(--color-primary)] p-6 space-y-6 shadow-sm">
      <div>
        <h1 className="font-heading text-3xl font-bold mb-2 text-[var(--color-primary)]">Site Settings</h1>
        <p className="font-body text-sm text-gray-600 max-w-3xl">
          This is the first production content surface. Brand text, public channels, hero copy, and footer messaging should all flow through here instead of hardcoded page edits.
        </p>
      </div>
      <SiteSettingsForm initialValues={settings} />
    </section>
  )
}
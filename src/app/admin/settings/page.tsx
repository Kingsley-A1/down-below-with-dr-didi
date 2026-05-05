import SiteSettingsForm from '@/components/admin/SiteSettingsForm'
import { getSiteSettings } from '@/lib/admin/repository'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings()

  return (
    <section className="bg-white rounded-2xl border p-6 space-y-6" style={{ borderColor: 'var(--color-border)' }}>
      <div>
        <h1 className="font-heading text-3xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>Site Settings</h1>
        <p className="font-body text-sm text-gray-600 max-w-3xl">
          This is the first production content surface. Brand text, public channels, hero copy, and footer messaging should all flow through here instead of hardcoded page edits.
        </p>
      </div>
      <SiteSettingsForm initialValues={settings} />
    </section>
  )
}
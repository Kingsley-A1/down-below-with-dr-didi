import AdminContentContainer from '@/components/admin/AdminContentContainer'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import SiteSettingsForm from '@/components/admin/SiteSettingsForm'
import { getSiteSettings } from '@/lib/admin/repository'
import { requireAdminPageSession } from '@/lib/admin/page-guard'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  await requireAdminPageSession({ nextPath: '/admin/settings', requiredRole: 'super_admin' })
  const settings = await getSiteSettings()

  return (
    <AdminContentContainer>
      <AdminPageHeader
        eyebrow="Content"
        title="Site Settings"
        description="Manage brand text, public channels, hero copy, imagery, and footer messaging from one production content surface."
      />
      <section className="admin-surface rounded-xl border border-border border-t-4 border-t-[var(--color-primary)] bg-white p-4 shadow-sm sm:p-5">
        <SiteSettingsForm initialValues={settings} />
      </section>
    </AdminContentContainer>
  )
}

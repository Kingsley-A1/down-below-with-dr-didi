import AdminUsersListClient from '@/components/admin/AdminUsersListClient'
import AdminContentContainer from '@/components/admin/AdminContentContainer'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { requireAdminPageSession } from '@/lib/admin/page-guard'

/**
 * Server-side wrapper for admin users list page
 * Redirects to login if not authenticated, checks for admin role
 */
export default async function AdminUsersPage() {
  await requireAdminPageSession({ nextPath: '/admin/users', requiredRole: 'super_admin' })

  return (
    <AdminContentContainer>
      <AdminPageHeader
        eyebrow="Operations"
        title="User Management"
        description="Review platform accounts, apply governance actions, and monitor user security status from one workflow."
      />
      <AdminUsersListClient />
    </AdminContentContainer>
  )
}

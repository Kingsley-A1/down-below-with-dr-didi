import AdminUserDetailClient from '@/components/admin/AdminUserDetailClient'
import AdminContentContainer from '@/components/admin/AdminContentContainer'
import { requireAdminPageSession } from '@/lib/admin/page-guard'

interface AdminUserDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

/**
 * Server-side wrapper for admin user detail page
 * Redirects to login if not authenticated, checks for admin role
 */
export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const { slug } = await params
  await requireAdminPageSession({ nextPath: `/admin/users/${slug}`, requiredRole: 'super_admin' })

  return (
    <AdminContentContainer>
      <AdminUserDetailClient userId={slug} />
    </AdminContentContainer>
  )
}

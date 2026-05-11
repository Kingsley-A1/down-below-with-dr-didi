import VaultModerationBoard from '@/components/admin/VaultModerationBoard'
import { listVaultSubmissions } from '@/lib/admin/repository'
import { canViewVaultIdentity } from '@/lib/admin/rbac'
import { requireAdminPageSession } from '@/lib/admin/page-guard'

export const dynamic = 'force-dynamic'

export default async function AdminVaultPage() {
  const session = await requireAdminPageSession({
    nextPath: '/admin/vault',
    requiredRole: 'super_admin',
  })

  const submissions = await listVaultSubmissions(
    { email: session.email, role: session.role },
    { includeIdentity: false }
  )

  return <VaultModerationBoard initialSubmissions={submissions} canRevealIdentity={canViewVaultIdentity(session.role)} />
}

import VaultModerationBoard from '@/components/admin/VaultModerationBoard'
import { listVaultSubmissions } from '@/lib/admin/repository'
import { canModerateVault, canViewVaultIdentity } from '@/lib/admin/rbac'
import { requireAdminPageSession } from '@/lib/admin/page-guard'

export const dynamic = 'force-dynamic'

export default async function AdminVaultPage() {
  // Moderators and up may view the board (identity stays masked); editors and
  // up may moderate and respond.
  const session = await requireAdminPageSession({
    nextPath: '/admin/vault',
    requiredRole: 'moderator',
  })

  const submissions = await listVaultSubmissions(
    { email: session.email, role: session.role },
    { includeIdentity: false }
  )

  return (
    <VaultModerationBoard
      initialSubmissions={submissions}
      canRevealIdentity={canViewVaultIdentity(session.role)}
      canModerate={canModerateVault(session.role)}
    />
  )
}

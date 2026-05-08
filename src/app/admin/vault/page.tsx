import VaultModerationBoard from '@/components/admin/VaultModerationBoard'
import { listVaultSubmissions } from '@/lib/admin/repository'

export const dynamic = 'force-dynamic'

export default async function AdminVaultPage() {
  const submissions = await listVaultSubmissions()

  return <VaultModerationBoard initialSubmissions={submissions} />
}

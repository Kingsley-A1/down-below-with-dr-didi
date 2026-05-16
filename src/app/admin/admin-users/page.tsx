import AdminAccountsBoard from '@/components/admin/AdminAccountsBoard'
import AdminContentContainer from '@/components/admin/AdminContentContainer'
import AdminDataLoadAlert from '@/components/admin/AdminDataLoadAlert'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { logAdminPageLoadError } from '@/lib/admin/observability'
import { requireAdminPageSession } from '@/lib/admin/page-guard'
import { listAdminAccounts } from '@/lib/admin/repository'

export const dynamic = 'force-dynamic'

export default async function AdminAccountsPage() {
  const session = await requireAdminPageSession({ nextPath: '/admin/admin-users', requiredRole: 'super_admin' })

  let accounts: Awaited<ReturnType<typeof listAdminAccounts>>
  let loadWarning: { requestId: string; userMessage: string } | null = null

  try {
    accounts = await listAdminAccounts()
  } catch (error) {
    accounts = []
    loadWarning = logAdminPageLoadError(
      {
        page: 'admin.admin-users',
        requestPath: '/admin/admin-users',
        fallbackMessage:
          'Admin accounts could not be loaded right now. Retry after connectivity is restored before making account changes.',
      },
      error
    )
  }

  return (
    <AdminContentContainer>
      <AdminPageHeader
        eyebrow="Super Admin"
        title="Admin Accounts"
        description="Create, edit, deactivate, and remove admin operators with role-based access control."
      />
      {loadWarning ? (
        <AdminDataLoadAlert
          title="Admin account data is temporarily unavailable"
          message={loadWarning.userMessage}
          requestId={loadWarning.requestId}
          retryPath="/admin/admin-users"
        />
      ) : null}
      <AdminAccountsBoard initialAccounts={accounts} currentAdminEmail={session.email} />
    </AdminContentContainer>
  )
}

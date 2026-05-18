import AdminDataLoadAlert from '@/components/admin/AdminDataLoadAlert'
import AlertsBoard from '@/components/admin/AlertsBoard'
import { logAdminPageLoadError } from '@/lib/admin/observability'
import { requireAdminPageSession } from '@/lib/admin/page-guard'
import { listSiteAlerts } from '@/lib/admin/repository'

export const dynamic = 'force-dynamic'

export default async function AdminAlertsPage() {
  await requireAdminPageSession({ nextPath: '/admin/alerts', requiredRole: 'editor' })

  let alerts: Awaited<ReturnType<typeof listSiteAlerts>>
  let loadWarning: { requestId: string; userMessage: string } | null = null

  try {
    alerts = await listSiteAlerts()
  } catch (error) {
    alerts = []
    loadWarning = logAdminPageLoadError(
      {
        page: 'admin.alerts',
        requestPath: '/admin/alerts',
        fallbackMessage:
          'Alert records could not be loaded right now. You can still continue once connectivity is restored.',
      },
      error
    )
  }

  return (
    <div className="space-y-5">
      {loadWarning ? (
        <AdminDataLoadAlert
          title="Alert data is temporarily unavailable"
          message={loadWarning.userMessage}
          requestId={loadWarning.requestId}
          retryPath="/admin/alerts"
        />
      ) : null}
      <AlertsBoard initialAlerts={alerts} />
    </div>
  )
}

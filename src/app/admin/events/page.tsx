import AdminContentContainer from '@/components/admin/AdminContentContainer'
import AdminDataLoadAlert from '@/components/admin/AdminDataLoadAlert'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import EventsBoard from '@/components/admin/EventsBoard'
import { logAdminPageLoadError } from '@/lib/admin/observability'
import { requireAdminPageSession } from '@/lib/admin/page-guard'
import { isTopLevelAdmin } from '@/lib/admin/rbac'
import { getAllEvents } from '@/lib/admin/repository'

export const dynamic = 'force-dynamic'

export default async function AdminEventsPage() {
  const session = await requireAdminPageSession({ nextPath: '/admin/events' })

  let events: Awaited<ReturnType<typeof getAllEvents>>
  let loadWarning: { requestId: string; userMessage: string } | null = null

  try {
    events = await getAllEvents()
  } catch (error) {
    events = []
    loadWarning = logAdminPageLoadError(
      {
        page: 'admin.events',
        requestPath: '/admin/events',
        fallbackMessage:
          'Event records are temporarily unavailable. You can continue creating new events and retry once connectivity stabilizes.',
      },
      error
    )
  }

  return (
    <AdminContentContainer>
      <AdminPageHeader
        eyebrow="Content"
        title="Events"
        description="Schedule outreach events, manage live streams, and moderate event engagement from one control room."
      />
      {loadWarning ? (
        <AdminDataLoadAlert
          title="Events data is temporarily unavailable"
          message={loadWarning.userMessage}
          requestId={loadWarning.requestId}
          retryPath="/admin/events"
        />
      ) : null}
      <EventsBoard initialEvents={events} allowDelete={isTopLevelAdmin(session.role)} hideHeader />
    </AdminContentContainer>
  )
}

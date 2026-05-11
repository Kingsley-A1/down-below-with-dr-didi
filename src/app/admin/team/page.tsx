import AdminContentContainer from '@/components/admin/AdminContentContainer'
import AdminDataLoadAlert from '@/components/admin/AdminDataLoadAlert'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import TeamMembersBoard from '@/components/admin/TeamMembersBoard'
import { logAdminPageLoadError } from '@/lib/admin/observability'
import { requireAdminPageSession } from '@/lib/admin/page-guard'
import { getAllTeamMembers } from '@/lib/admin/repository'

export const dynamic = 'force-dynamic'

export default async function AdminTeamPage() {
  await requireAdminPageSession({ nextPath: '/admin/team' })

  let members: Awaited<ReturnType<typeof getAllTeamMembers>>
  let loadWarning: { requestId: string; userMessage: string } | null = null

  try {
    members = await getAllTeamMembers()
  } catch (error) {
    members = []
    loadWarning = logAdminPageLoadError(
      {
        page: 'admin.team',
        requestPath: '/admin/team',
        fallbackMessage:
          'Team members could not be loaded right now. Existing board actions are still available, but refresh after connectivity recovers.',
      },
      error
    )
  }

  return (
    <AdminContentContainer>
      <AdminPageHeader
        eyebrow="Content"
        title="Team Members"
        description="Maintain leadership profiles, biographies, publishing status, and display order for public team presentation."
      />
      {loadWarning ? (
        <AdminDataLoadAlert
          title="Team data is temporarily unavailable"
          message={loadWarning.userMessage}
          requestId={loadWarning.requestId}
          retryPath="/admin/team"
        />
      ) : null}
      <TeamMembersBoard initialMembers={members} hideHeader />
    </AdminContentContainer>
  )
}

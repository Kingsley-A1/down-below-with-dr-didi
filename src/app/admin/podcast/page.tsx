import AdminDataLoadAlert from '@/components/admin/AdminDataLoadAlert'
import PodcastEpisodesBoard from '@/components/admin/PodcastEpisodesBoard'
import { logAdminPageLoadError } from '@/lib/admin/observability'
import { requireAdminPageSession } from '@/lib/admin/page-guard'
import { getAllPodcastEpisodes } from '@/lib/admin/repository'

export const dynamic = 'force-dynamic'

export default async function AdminPodcastPage() {
  await requireAdminPageSession({ nextPath: '/admin/podcast' })

  let episodes: Awaited<ReturnType<typeof getAllPodcastEpisodes>>
  let loadWarning: { requestId: string; userMessage: string } | null = null

  try {
    episodes = await getAllPodcastEpisodes()
  } catch (error) {
    episodes = []
    loadWarning = logAdminPageLoadError(
      {
        page: 'admin.podcast',
        requestPath: '/admin/podcast',
        fallbackMessage:
          'Podcast episodes are unavailable right now. Existing publishing forms remain visible so work can continue after a retry.',
      },
      error
    )
  }

  return (
    <div className="space-y-5">
      {loadWarning ? (
        <AdminDataLoadAlert
          title="Podcast data is temporarily unavailable"
          message={loadWarning.userMessage}
          requestId={loadWarning.requestId}
          retryPath="/admin/podcast"
        />
      ) : null}
      <PodcastEpisodesBoard initialEpisodes={episodes} />
    </div>
  )
}

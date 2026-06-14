import AdminContentContainer from '@/components/admin/AdminContentContainer'
import AdminDataLoadAlert from '@/components/admin/AdminDataLoadAlert'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import MediaLibrary from '@/components/admin/MediaLibrary'
import { logAdminPageLoadError } from '@/lib/admin/observability'
import { listMediaAssets } from '@/lib/admin/repository'
import { requireAdminPageSession } from '@/lib/admin/page-guard'

export const dynamic = 'force-dynamic'

export default async function AdminMediaPage() {
  await requireAdminPageSession({ nextPath: '/admin/media' })

  let assets: Awaited<ReturnType<typeof listMediaAssets>>
  let loadWarning: { requestId: string; userMessage: string } | null = null

  try {
    assets = await listMediaAssets()
  } catch (error) {
    assets = []
    loadWarning = logAdminPageLoadError(
      {
        page: 'admin.media',
        requestPath: '/admin/media',
        fallbackMessage:
          'Media assets could not be loaded right now. Upload and cleanup actions will become available after connectivity is restored.',
      },
      error
    )
  }

  return (
    <AdminContentContainer>
      <AdminPageHeader
        eyebrow="Operations"
        title="Media Library"
        description="Upload images in one guided step, then manage approved media used across the platform."
      />
      {loadWarning ? (
        <AdminDataLoadAlert
          title="Media data is temporarily unavailable"
          message={loadWarning.userMessage}
          requestId={loadWarning.requestId}
          retryPath="/admin/media"
        />
      ) : null}
      <MediaLibrary initialAssets={assets} />
    </AdminContentContainer>
  )
}

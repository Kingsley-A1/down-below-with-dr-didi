import AdminContentContainer from '@/components/admin/AdminContentContainer'
import AdminDataLoadAlert from '@/components/admin/AdminDataLoadAlert'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import GalleryImagesBoard from '@/components/admin/GalleryImagesBoard'
import { logAdminPageLoadError } from '@/lib/admin/observability'
import { requireAdminPageSession } from '@/lib/admin/page-guard'
import { getAllGalleryImages } from '@/lib/admin/repository'

export const dynamic = 'force-dynamic'

export default async function AdminGalleryPage() {
  await requireAdminPageSession({ nextPath: '/admin/gallery' })

  let images: Awaited<ReturnType<typeof getAllGalleryImages>>
  let loadWarning: { requestId: string; userMessage: string } | null = null

  try {
    images = await getAllGalleryImages()
  } catch (error) {
    images = []
    loadWarning = logAdminPageLoadError(
      {
        page: 'admin.gallery',
        requestPath: '/admin/gallery',
        fallbackMessage:
          'Gallery records could not be loaded. You can continue to create assets and retry once database connectivity stabilizes.',
      },
      error
    )
  }

  return (
    <AdminContentContainer>
      <AdminPageHeader
        eyebrow="Content"
        title="Gallery Images"
        description="Curate outreach visuals with category tags, metadata, and publication states for the public gallery experience."
      />
      {loadWarning ? (
        <AdminDataLoadAlert
          title="Gallery data is temporarily unavailable"
          message={loadWarning.userMessage}
          requestId={loadWarning.requestId}
          retryPath="/admin/gallery"
        />
      ) : null}
      <GalleryImagesBoard initialImages={images} hideHeader />
    </AdminContentContainer>
  )
}

import AdminContentContainer from '@/components/admin/AdminContentContainer'
import AdminDataLoadAlert from '@/components/admin/AdminDataLoadAlert'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import ReviewsBoard from '@/components/admin/ReviewsBoard'
import { logAdminPageLoadError } from '@/lib/admin/observability'
import { requireAdminPageSession } from '@/lib/admin/page-guard'
import { getAllReviews } from '@/lib/reviews/repository'

export const dynamic = 'force-dynamic'

export default async function AdminReviewsPage() {
  await requireAdminPageSession({ nextPath: '/admin/reviews' })

  let reviews: Awaited<ReturnType<typeof getAllReviews>>
  let loadWarning: { requestId: string; userMessage: string } | null = null

  try {
    reviews = await getAllReviews()
  } catch (error) {
    reviews = []
    loadWarning = logAdminPageLoadError(
      {
        page: 'admin.reviews',
        requestPath: '/admin/reviews',
        fallbackMessage:
          'Reviews could not be loaded. You can retry once database connectivity stabilizes.',
      },
      error
    )
  }

  return (
    <AdminContentContainer>
      <AdminPageHeader
        eyebrow="Community proof"
        title="Reviews"
        description="Moderate public submissions, publish selected reviews, and add optional team replies."
      />
      {loadWarning ? (
        <AdminDataLoadAlert
          title="Reviews are temporarily unavailable"
          message={loadWarning.userMessage}
          requestId={loadWarning.requestId}
          retryPath="/admin/reviews"
        />
      ) : null}
      <ReviewsBoard initialReviews={reviews} />
    </AdminContentContainer>
  )
}

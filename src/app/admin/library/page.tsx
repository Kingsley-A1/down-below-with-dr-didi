import AdminContentContainer from '@/components/admin/AdminContentContainer'
import AdminDataLoadAlert from '@/components/admin/AdminDataLoadAlert'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import LibraryArticlesBoard from '@/components/admin/LibraryArticlesBoard'
import { logAdminPageLoadError } from '@/lib/admin/observability'
import { requireAdminPageSession } from '@/lib/admin/page-guard'
import { getAllLibraryArticles } from '@/lib/library/repository'

export const dynamic = 'force-dynamic'

export default async function AdminLibraryPage() {
  await requireAdminPageSession({ nextPath: '/admin/library', requiredRole: 'founder_admin' })

  let articles: Awaited<ReturnType<typeof getAllLibraryArticles>>
  let loadWarning: { requestId: string; userMessage: string } | null = null

  try {
    articles = await getAllLibraryArticles()
  } catch (error) {
    articles = []
    loadWarning = logAdminPageLoadError(
      {
        page: 'admin.library',
        requestPath: '/admin/library',
        fallbackMessage:
          'Library articles could not be loaded right now. Retry after connectivity is restored before publishing changes.',
      },
      error
    )
  }

  return (
    <AdminContentContainer>
      <AdminPageHeader
        eyebrow="Content"
        title="Health Library"
        description="Write, draft, and publish teaching articles for the public DownBelow health library."
      />
      {loadWarning ? (
        <AdminDataLoadAlert
          title="Library data is temporarily unavailable"
          message={loadWarning.userMessage}
          requestId={loadWarning.requestId}
          retryPath="/admin/library"
        />
      ) : null}
      <LibraryArticlesBoard initialArticles={articles} />
    </AdminContentContainer>
  )
}

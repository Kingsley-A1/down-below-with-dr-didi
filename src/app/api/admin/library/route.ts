import { NextRequest, NextResponse } from 'next/server'
import { createLibraryArticle, getAllLibraryArticles } from '@/lib/library/repository'
import { libraryArticleSchema } from '@/lib/validations'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'founder_admin')
  if (roleError) {
    return roleError
  }

  try {
    const articles = await getAllLibraryArticles()
    return NextResponse.json({ articles })
  } catch (error) {
    return mapApiError(error, 'Failed to list library articles')
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'founder_admin')
  if (roleError) {
    return roleError
  }

  try {
    const body = await request.json()
    const parsed = libraryArticleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    }

    const { coverImageUrl, publishedAt, ...rest } = parsed.data
    const article = await createLibraryArticle(
      {
        ...rest,
        coverImageUrl: coverImageUrl || undefined,
        publishedAt: publishedAt || undefined,
      },
      { email: session.email, role: session.role }
    )

    return NextResponse.json({ success: true, article }, { status: 201 })
  } catch (error) {
    return mapApiError(error, 'Failed to create library article')
  }
}

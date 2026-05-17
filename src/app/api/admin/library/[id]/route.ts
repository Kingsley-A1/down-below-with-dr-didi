import { NextRequest, NextResponse } from 'next/server'
import { deleteLibraryArticle, updateLibraryArticle } from '@/lib/library/repository'
import { libraryArticleUpdateSchema } from '@/lib/validations'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'founder_admin')
  if (roleError) {
    return roleError
  }

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = libraryArticleUpdateSchema.safeParse({ ...body, id })

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    }

    const { coverImageUrl, publishedAt } = parsed.data
    const article = await updateLibraryArticle(
      id,
      {
        ...(parsed.data.slug !== undefined && { slug: parsed.data.slug }),
        ...(parsed.data.title !== undefined && { title: parsed.data.title }),
        ...(parsed.data.excerpt !== undefined && { excerpt: parsed.data.excerpt }),
        ...(parsed.data.content !== undefined && { content: parsed.data.content }),
        ...(parsed.data.category !== undefined && { category: parsed.data.category }),
        ...(parsed.data.readTime !== undefined && { readTime: parsed.data.readTime }),
        ...(parsed.data.status !== undefined && { status: parsed.data.status }),
        ...(coverImageUrl !== undefined && { coverImageUrl: coverImageUrl || null }),
        ...(publishedAt !== undefined && { publishedAt: publishedAt || null }),
      },
      { email: session.email, role: session.role }
    )

    return NextResponse.json({ success: true, article })
  } catch (error) {
    return mapApiError(error, 'Failed to update library article', { notFoundPrefix: 'Library article' })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'founder_admin')
  if (roleError) {
    return roleError
  }

  const { id } = await params

  try {
    await deleteLibraryArticle(id, { email: session.email, role: session.role })
    return NextResponse.json({ success: true })
  } catch (error) {
    return mapApiError(error, 'Failed to delete library article', { notFoundPrefix: 'Library article' })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { deletePodcastEpisode, updatePodcastEpisode } from '@/lib/admin/repository'
import { podcastEpisodeSchema } from '@/lib/validations'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { validationError } from '@/lib/api/errors'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'editor')
  if (roleError) {
    return roleError
  }

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = podcastEpisodeSchema.partial().safeParse(body)

    if (!parsed.success) {
      return validationError(parsed.error)
    }

    const {
      audioType,
      coverImage,
      guestName,
      transcript,
      externalSourceUrl,
      publishedAt,
      ...rest
    } = parsed.data

    const episode = await updatePodcastEpisode(
      id,
      {
        ...rest,
        ...(audioType !== undefined && { audioType: audioType || null }),
        ...(coverImage !== undefined && { coverImage: coverImage || null }),
        ...(guestName !== undefined && { guestName: guestName || null }),
        ...(transcript !== undefined && { transcript: transcript || null }),
        ...(externalSourceUrl !== undefined && { externalSourceUrl: externalSourceUrl || null }),
        ...(publishedAt !== undefined && { publishedAt: publishedAt || null }),
      },
      { email: session.email, role: session.role }
    )

    return NextResponse.json({ success: true, episode })
  } catch (error) {
    return mapApiError(error, 'Failed to update podcast episode', { request, identity: { email: session.email, role: session.role } })
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

  const roleError = requireAdminRole(session, 'super_admin')
  if (roleError) {
    return roleError
  }

  const { id } = await params

  try {
    await deletePodcastEpisode(id, { email: session.email, role: session.role })
    return NextResponse.json({ success: true })
  } catch (error) {
    return mapApiError(error, 'Failed to delete podcast episode', { request, identity: { email: session.email, role: session.role } })
  }
}

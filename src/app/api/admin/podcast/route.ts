import { NextRequest, NextResponse } from 'next/server'
import { createPodcastEpisode, getAllPodcastEpisodes } from '@/lib/admin/repository'
import { podcastEpisodeSchema } from '@/lib/validations'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { validationError } from '@/lib/api/errors'

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'moderator')
  if (roleError) {
    return roleError
  }

  const episodes = await getAllPodcastEpisodes()
  return NextResponse.json({ episodes })
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'moderator')
  if (roleError) {
    return roleError
  }

  try {
    const body = await request.json()
    const parsed = podcastEpisodeSchema.safeParse(body)

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

    const episode = await createPodcastEpisode(
      {
        ...rest,
        audioType: audioType || undefined,
        coverImage: coverImage || undefined,
        guestName: guestName || undefined,
        transcript: transcript || undefined,
        externalSourceUrl: externalSourceUrl || undefined,
        publishedAt: publishedAt || undefined,
      },
      { email: session.email, role: session.role }
    )

    return NextResponse.json({ success: true, episode }, { status: 201 })
  } catch (error) {
    return mapApiError(error, 'Failed to create podcast episode', { request, identity: { email: session.email, role: session.role } })
  }
}

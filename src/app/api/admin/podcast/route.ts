import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin/session'
import { createPodcastEpisode, getAllPodcastEpisodes } from '@/lib/admin/repository'
import { podcastEpisodeSchema } from '@/lib/validations'

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  return verifyAdminSession(token)
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const episodes = await getAllPodcastEpisodes()
  return NextResponse.json({ episodes })
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = podcastEpisodeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
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
    const message = error instanceof Error ? error.message : 'Failed to create podcast episode'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin/session'
import { deletePodcastEpisode, updatePodcastEpisode } from '@/lib/admin/repository'
import { podcastEpisodeSchema } from '@/lib/validations'

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  return verifyAdminSession(token)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = podcastEpisodeSchema.partial().safeParse(body)

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
    const message = error instanceof Error ? error.message : 'Failed to update podcast episode'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    await deletePodcastEpisode(id, { email: session.email, role: session.role })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete podcast episode'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getEventBySlug } from '@/lib/events/repository'
import { mapApiError } from '@/lib/admin/api-guard'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const event = await getEventBySlug(slug)

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    return mapApiError(error, 'Failed to fetch event')
  }
}

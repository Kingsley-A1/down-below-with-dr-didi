import { NextRequest, NextResponse } from 'next/server'
import { getPublishedEvents } from '@/lib/events/repository'
import { mapApiError } from '@/lib/admin/api-guard'

export async function GET(_request: NextRequest) {
  try {
    const events = await getPublishedEvents()
    return NextResponse.json({ events })
  } catch (error) {
    return mapApiError(error, 'Failed to fetch events')
  }
}

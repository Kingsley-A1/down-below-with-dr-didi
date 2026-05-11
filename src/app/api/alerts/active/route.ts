import { NextResponse } from 'next/server'
import { listPublicActiveSiteAlerts } from '@/lib/admin/repository'
import { hasDatabaseConfig } from '@/lib/env'

export const dynamic = 'force-dynamic'

const FALLBACK_ALERTS = [
  {
    id: 'seeded-fallback',
    text: 'Work in Progress: The website is currently being improved. If you notice anything you dislike, please reach out on 09036826272.',
    speed: 100,
    durationSeconds: 24,
    startsAt: new Date('2026-05-11T00:00:00.000Z').toISOString(),
    endsAt: null,
  },
]

export async function GET() {
  if (!hasDatabaseConfig()) {
    return NextResponse.json({ alerts: FALLBACK_ALERTS }, { status: 200 })
  }

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB timeout')), 2000)
    )
    const alerts = await Promise.race([listPublicActiveSiteAlerts(), timeout])

    if (alerts.length === 0) {
      return NextResponse.json({ alerts: FALLBACK_ALERTS }, { status: 200 })
    }

    return NextResponse.json({ alerts }, { status: 200 })
  } catch {
    return NextResponse.json({ alerts: FALLBACK_ALERTS }, { status: 200 })
  }
}

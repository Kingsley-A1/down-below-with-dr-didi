import { NextResponse } from 'next/server'
import { listPublicActiveSiteAlerts } from '@/lib/admin/repository'
import { readPublicDatabase } from '@/lib/public-database'

export const dynamic = 'force-dynamic'

function logPublicAlertsFallback(context: string, error: unknown): void {
  if (process.env.NODE_ENV === 'test') {
    return
  }

  const message = error instanceof Error ? error.message : String(error)
  console.warn('[site-alerts.public.fallback]', {
    context,
    message,
    timestamp: new Date().toISOString(),
  })
}

export async function GET() {
  const alerts = await readPublicDatabase({
    context: 'site.alerts.active',
    fallback: [],
    query: listPublicActiveSiteAlerts,
    onError: logPublicAlertsFallback,
  })

  return NextResponse.json({ alerts }, { status: 200 })
}

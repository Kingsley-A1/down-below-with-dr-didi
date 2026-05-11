'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { CSSProperties } from 'react'

type PublicAlert = {
  id: string
  text: string
  speed: number
  durationSeconds: number
}

export default function SiteAlertTicker() {
  const pathname = usePathname()
  const [alerts, setAlerts] = useState<PublicAlert[]>([])

  useEffect(() => {
    let mounted = true

    const loadAlerts = async () => {
      try {
        const response = await fetch('/api/alerts/active', { cache: 'no-store' })

        if (!response.ok) {
          return
        }

        const data = (await response.json()) as { alerts?: PublicAlert[] }

        if (mounted) {
          setAlerts(data.alerts ?? [])
        }
      } catch {
        if (mounted) {
          setAlerts([])
        }
      }
    }

    void loadAlerts()

    const intervalId = window.setInterval(() => {
      void loadAlerts()
    }, 60000)

    return () => {
      mounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  const animationDuration = useMemo(() => {
    if (alerts.length === 0) {
      return 24
    }

    const durations = alerts.map((alert) => {
      const speed = Math.max(alert.speed, 1)
      return Math.max(8, Math.round((alert.durationSeconds * 100) / speed))
    })

    const total = durations.reduce((sum, value) => sum + value, 0)
    return Math.max(8, Math.round(total / durations.length))
  }, [alerts])

  const text = useMemo(() => alerts.map((alert) => alert.text.trim()).filter(Boolean).join('  •  '), [alerts])

  if (pathname.startsWith('/admin')) {
    return null
  }

  if (!text) {
    return null
  }

  return (
    <div className="site-alert-ticker" role="status" aria-live="polite">
      <div className="site-alert-ticker__chip">Notice</div>
      <div className="site-alert-ticker__viewport">
        <div
          className="site-alert-ticker__track"
          style={{ '--site-alert-duration': `${animationDuration}s` } as CSSProperties}
        >
          <span className="site-alert-ticker__segment">{text}</span>
          <span className="site-alert-ticker__segment" aria-hidden="true">
            {text}
          </span>
        </div>
      </div>
    </div>
  )
}

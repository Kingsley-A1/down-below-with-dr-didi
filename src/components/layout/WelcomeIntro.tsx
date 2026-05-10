'use client'

import { useEffect, useState } from 'react'

const INTRO_DURATION_MS = 3500
const REDUCED_MOTION_DURATION_MS = 1500
const SESSION_KEY = 'dbwd-intro-seen'

export default function WelcomeIntro() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (window.sessionStorage.getItem(SESSION_KEY) === '1') {
      return undefined
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.sessionStorage.setItem(SESSION_KEY, '1')
    const showTimer = window.setTimeout(() => {
      setVisible(true)
    }, 0)

    const hideTimer = window.setTimeout(() => {
      setVisible(false)
    }, reduceMotion ? REDUCED_MOTION_DURATION_MS : INTRO_DURATION_MS)

    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="welcome-intro fixed inset-0 z-120 flex items-center justify-center px-6"
      role="status"
      aria-live="polite"
      style={{ backgroundColor: 'var(--color-primary)' }}
    >
      <div className="text-center text-white">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.68)' }}>
          Welcome to
        </p>
        <p className="mt-3 font-heading text-3xl font-bold sm:text-5xl">
          DownBelow Family
        </p>
        <p className="mt-3 font-body text-sm sm:text-base" style={{ color: 'rgba(255,255,255,0.72)' }}>
          Expose love, educate, and heal.
        </p>
        <span className="mx-auto mt-5 block h-1 w-24 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute right-4 top-4 rounded-full px-4 py-2 font-body text-xs font-semibold"
        style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff' }}
      >
        Skip
      </button>
    </div>
  )
}

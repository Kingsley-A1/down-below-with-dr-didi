'use client'

import { useEffect, useState } from 'react'

const INTRO_DURATION_MS = 5000
const REDUCED_MOTION_DURATION_MS = 2200
const SESSION_KEY = 'dbwd-intro-seen'

export default function WelcomeIntro() {
  const [phase, setPhase] = useState<'checking' | 'visible' | 'hidden'>('checking')

  useEffect(() => {
    if (window.sessionStorage.getItem(SESSION_KEY) === '1') {
      setPhase('hidden')
      return undefined
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.sessionStorage.setItem(SESSION_KEY, '1')
    setPhase('visible')

    const hideTimer = window.setTimeout(() => {
      setPhase('hidden')
    }, reduceMotion ? REDUCED_MOTION_DURATION_MS : INTRO_DURATION_MS)

    return () => {
      window.clearTimeout(hideTimer)
    }
  }, [])

  if (phase === 'hidden') return null

  return (
    <div
      className="welcome-intro fixed inset-0 z-120 flex items-center justify-center px-6"
      role="status"
      aria-live="polite"
      style={{ backgroundColor: 'var(--color-primary)' }}
    >
      <div className="welcome-intro__content text-center text-white">
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
        onClick={() => setPhase('hidden')}
        className="absolute right-4 top-4 rounded-full px-4 py-2 font-body text-xs font-semibold"
        style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff' }}
      >
        Skip
      </button>
    </div>
  )
}

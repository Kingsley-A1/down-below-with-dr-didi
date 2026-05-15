'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const INTRO_DURATION_MS = 3900
const REDUCED_MOTION_DURATION_MS = 1800
const COOLDOWN_MS = 24 * 60 * 60 * 1000
const COOLDOWN_KEY = 'dbwd-intro-last-shown-at'

export default function WelcomeIntro() {
  const pathname = usePathname() || ''
  const [phase, setPhase] = useState<'checking' | 'visible' | 'hidden'>('checking')
  const isHomePage = pathname === '/' || pathname === '/home'

  useEffect(() => {
    if (!isHomePage) {
      return
    }

    const lastShownAt = Number(window.localStorage.getItem(COOLDOWN_KEY) || '0')
    if (lastShownAt && Date.now() - lastShownAt < COOLDOWN_MS) {
      const hiddenTimer = window.setTimeout(() => setPhase('hidden'), 0)
      return () => window.clearTimeout(hiddenTimer)
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.localStorage.setItem(COOLDOWN_KEY, Date.now().toString())
    const showTimer = window.setTimeout(() => setPhase('visible'), 0)

    const hideTimer = window.setTimeout(() => {
      setPhase('hidden')
    }, reduceMotion ? REDUCED_MOTION_DURATION_MS : INTRO_DURATION_MS)

    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
    }
  }, [isHomePage])

  if (!isHomePage || phase !== 'visible') return null

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
        <p className="mt-3 font-heading text-4xl font-bold uppercase tracking-normal sm:text-6xl">
          DOWNBELOW
        </p>
        <p
          className="welcome-intro__typing mx-auto mt-2 max-w-max font-heading text-xl font-bold sm:text-3xl"
          style={{ color: 'var(--color-accent)' }}
        >
          With Dr. Didi
        </p>
        <p className="mt-5 font-body text-sm font-semibold sm:text-base" style={{ color: 'rgba(255,255,255,0.78)' }}>
          Expose in Love, Teach, Win
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

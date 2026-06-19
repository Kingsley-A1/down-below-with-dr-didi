'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

function isPlainInternalNavigation(event: MouseEvent, anchor: HTMLAnchorElement) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false
  }

  if (anchor.target && anchor.target !== '_self') {
    return false
  }

  if (anchor.hasAttribute('download')) {
    return false
  }

  const targetUrl = new URL(anchor.href, window.location.href)

  if (targetUrl.origin !== window.location.origin) {
    return false
  }

  return targetUrl.pathname !== window.location.pathname || targetUrl.search !== window.location.search
}

export default function PageLoadingLine() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const settleTimerRef = useRef<number | null>(null)
  const fallbackTimerRef = useRef<number | null>(null)
  const progressTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const clearTimers = () => {
      for (const timer of [settleTimerRef.current, fallbackTimerRef.current, progressTimerRef.current]) {
        if (timer) {
          window.clearTimeout(timer)
        }
      }
    }

    clearTimers()
    settleTimerRef.current = window.setTimeout(() => {
      setProgress(100)
      fallbackTimerRef.current = window.setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 180)
    }, 0)

    return clearTimers
  }, [pathname])

  useEffect(() => {
    const start = () => {
      if (visible) {
        return
      }

      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current)
      }

      setVisible(true)
      setProgress(28)
      progressTimerRef.current = window.setTimeout(() => setProgress(72), 120)
      fallbackTimerRef.current = window.setTimeout(() => {
        setProgress(100)
        settleTimerRef.current = window.setTimeout(() => {
          setVisible(false)
          setProgress(0)
        }, 180)
      }, 3500)
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null

      if (!(target instanceof HTMLAnchorElement) || !isPlainInternalNavigation(event, target)) {
        return
      }

      start()
    }

    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      for (const timer of [settleTimerRef.current, fallbackTimerRef.current, progressTimerRef.current]) {
        if (timer) {
          window.clearTimeout(timer)
        }
      }
    }
  }, [visible])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-0.5 overflow-hidden bg-transparent"
    >
      <div
        className="h-full origin-left transition-[width,opacity] duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          background: 'linear-gradient(90deg, var(--color-accent), #7dffbe, var(--color-primary-light))',
          boxShadow: visible ? '0 0 18px rgba(250, 224, 30, 0.42)' : 'none',
        }}
      />
    </div>
  )
}

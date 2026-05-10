'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Download, X } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const INSTALL_PROMPT_DISMISSED_KEY = 'dbfh-install-prompt-dismissed'
const SITE_VISIT_COUNT_KEY = 'dbfh-site-visit-count'
const MIN_VISITS_BEFORE_PROMPT = 2
const PROMPT_DELAY_MS = 15000

export default function InstallPrompt() {
  const pathname = usePathname()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (pathname.startsWith('/admin')) {
      return
    }

    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silent failure keeps install prompt non-blocking.
      })
    }

    const dismissed = window.localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY)
    if (dismissed === '1') {
      return
    }

    const currentVisitCount = Number(window.localStorage.getItem(SITE_VISIT_COUNT_KEY) || '0') + 1
    window.localStorage.setItem(SITE_VISIT_COUNT_KEY, String(currentVisitCount))

    let showTimer: ReturnType<typeof setTimeout> | null = null

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)

      if (currentVisitCount < MIN_VISITS_BEFORE_PROMPT) {
        return
      }

      showTimer = setTimeout(() => {
        setIsVisible(true)
      }, PROMPT_DELAY_MS)
    }

    const onAppInstalled = () => {
      setIsVisible(false)
      setDeferredPrompt(null)
      window.localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, '1')
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      if (showTimer) {
        clearTimeout(showTimer)
      }
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [pathname])

  async function handleInstall() {
    if (!deferredPrompt) {
      return
    }

    setIsInstalling(true)
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice

    if (choice.outcome === 'dismissed') {
      window.localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, '1')
    }

    setIsInstalling(false)
    setIsVisible(false)
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    window.localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, '1')
    setIsVisible(false)
  }

  if (!isVisible || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-5 right-5 z-[70] max-w-sm rounded-2xl border p-4 shadow-xl" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
      <button
        type="button"
        aria-label="Dismiss install prompt"
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-full p-1"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <X size={16} />
      </button>

      <div className="pr-8">
        <p className="font-body text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Install DownBelow Family
        </p>
        <p className="mt-1 font-body text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Add this app to your home screen for faster access, offline loading, and a cleaner full-screen experience.
        </p>
      </div>

      <button
        type="button"
        onClick={() => void handleInstall()}
        disabled={isInstalling}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 font-body text-sm font-semibold"
        style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
      >
        <Download size={16} />
        {isInstalling ? 'Preparing...' : 'Install App'}
      </button>
    </div>
  )
}
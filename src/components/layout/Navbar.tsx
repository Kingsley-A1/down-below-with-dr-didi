'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Menu, X } from 'lucide-react'
import { siteConfig } from '@/lib/site-config'
import SiteAlertTicker from '@/components/layout/SiteAlertTicker'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/library', label: 'Library' },
  { href: '/outreach', label: 'Outreach' },
  { href: '/podcast', label: 'Podcast' },
  { href: '/vault', label: 'V-Vault' },
  { href: '/review', label: 'Reviews' },
  { href: '/team', label: 'Team' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/about', label: 'About' },
]

const legalLinks = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
]

type SessionUser = {
  displayName?: string
  email?: string
}

function getProfileInitials(user: SessionUser | null) {
  const source = user?.displayName?.trim() || user?.email?.split('@')[0]?.trim() || 'Me'
  const words = source.split(/\s+/).filter(Boolean)

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

export default function Navbar() {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [menuOpen])

  const loadSessionState = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', {
        cache: 'no-store',
      })

      if (!response.ok) {
        setIsAuthenticated(false)
        setSessionUser(null)
        return
      }

      const data = (await response.json()) as { authenticated?: boolean; user?: SessionUser | null }
      setIsAuthenticated(Boolean(data.authenticated))
      setSessionUser(data.authenticated ? data.user ?? null : null)
    } catch {
      setIsAuthenticated(false)
      setSessionUser(null)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSessionState()
    }, 0)

    const handleAuthChange = () => {
      void loadSessionState()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadSessionState()
      }
    }

    window.addEventListener('focus', handleAuthChange)
    window.addEventListener('auth-state-changed', handleAuthChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('focus', handleAuthChange)
      window.removeEventListener('auth-state-changed', handleAuthChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loadSessionState, pathname])

  const ctaHref = isAuthenticated ? '/contact' : '/register'
  const ctaLabel = isAuthenticated ? 'Book Now' : 'Register'
  const mobileNavigationLinks = isAuthenticated
    ? [...navLinks, { href: '/me', label: 'My Space' }]
    : navLinks
  const profileInitials = getProfileInitials(sessionUser)

  if (isAdminRoute) {
    return null
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: 'var(--color-bg)',
        boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
      }}
    >
      <nav
        className="max-w-container mx-auto px-6 h-16 flex items-center justify-between"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.jpg"
            alt={siteConfig.name}
            width={44}
            height={44}
            className="rounded-full object-cover"
          />
          <span className="hidden min-w-0 flex-col justify-center leading-none sm:flex" aria-label={`${siteConfig.shortName} with Dr. Didi`}>
            <span className="font-heading text-[15px] font-bold uppercase tracking-normal" style={{ color: 'var(--color-primary)' }}>
              DOWNBELOW
            </span>
            <span className="mt-0.5 font-body text-[10px] font-bold leading-none" style={{ color: 'var(--color-primary-light)' }}>
              With Dr. Didi
            </span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden lg:flex items-center gap-3 xl:gap-5">
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={pathname === href ? 'page' : undefined}
                className="font-body font-medium text-[13px] transition-colors rounded-full px-1.5 py-2 xl:text-sm"
                style={{
                  color: 'var(--color-primary)',
                  textDecoration: pathname === href ? 'underline' : 'none',
                  textUnderlineOffset: '8px',
                }}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Book Now CTA */}
        <div className="hidden lg:flex items-center gap-2.5">
          <Link
            href={ctaHref}
            className="bg-accent text-primary font-body font-semibold text-sm px-5 py-2.5 rounded-full transition-colors"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
          >
            {ctaLabel}
          </Link>
          {isAuthenticated ? (
            <Link
              href="/me"
              aria-label="Open my space"
              title="My Space"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border font-body text-xs font-bold shadow-sm transition-colors hover:bg-[var(--color-primary-muted)]"
              style={{ borderColor: 'rgba(11, 78, 65, 0.22)', color: 'var(--color-primary)' }}
            >
              {profileInitials}
            </Link>
          ) : null}
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2"
          style={{ color: 'var(--color-primary)' }}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div
          className="fixed inset-x-0 bottom-0 top-16 z-50 flex flex-col overflow-y-auto overscroll-contain border-t px-6 py-5 shadow-lg lg:hidden"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-bg)',
          }}
        >
          <div className="flex flex-col gap-1">
            {mobileNavigationLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? 'page' : undefined}
                className="font-body font-medium text-base py-3 border-b last:border-0"
                style={{ color: 'var(--color-primary)', borderColor: 'var(--color-border)' }}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </div>
          <Link
            href={ctaHref}
            className="mt-4 font-body font-semibold text-sm px-5 py-3 rounded-full text-center transition-colors"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
            onClick={() => setMenuOpen(false)}
          >
            {ctaLabel}
          </Link>
          <div className="mt-6 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
            <p className="mb-2 font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Legal
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              {legalLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="font-body underline-offset-4 hover:text-slate-600 hover:underline"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <SiteAlertTicker />
    </header>
  )
}

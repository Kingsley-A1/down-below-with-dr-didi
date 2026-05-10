'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { siteConfig } from '@/lib/site-config'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/library', label: 'Library' },
  { href: '/about', label: 'About' },
  { href: '/team', label: 'Team' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/podcast', label: 'Podcast' },
  { href: '/vault', label: 'V-Vault' },
  { href: '/outreach', label: 'Outreach' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadSessionState() {
      try {
        const response = await fetch('/api/auth/session', {
          cache: 'no-store',
        })

        if (!response.ok) {
          return
        }

        const data = (await response.json()) as { authenticated?: boolean }
        if (mounted) {
          setIsAuthenticated(Boolean(data.authenticated))
        }
      } catch {
        // Keep unauthenticated CTA fallback on network errors.
      }
    }

    void loadSessionState()

    return () => {
      mounted = false
    }
  }, [])

  const ctaHref = isAuthenticated ? '/contact' : '/register'
  const ctaLabel = isAuthenticated ? 'Book Now' : 'Register'

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
          <span
            className="font-heading font-bold text-lg hidden sm:block"
            style={{ color: 'var(--color-primary)' }}
          >
            {siteConfig.shortName}
          </span>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden lg:flex items-center gap-5 xl:gap-8">
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={pathname === href ? 'page' : undefined}
                className="font-body font-medium text-sm transition-colors rounded-full px-1 py-2"
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
        <div className="hidden lg:block">
          <Link
            href={ctaHref}
            className="bg-accent text-primary font-body font-semibold text-sm px-5 py-2.5 rounded-full transition-colors"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
          >
            {ctaLabel}
          </Link>
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
          className="lg:hidden border-t px-6 py-6 flex flex-col gap-4 shadow-lg"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-bg)',
          }}
        >
          {navLinks.map(({ href, label }) => (
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
          <Link
            href={ctaHref}
            className="mt-2 font-body font-semibold text-sm px-5 py-3 rounded-full text-center transition-colors"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
            onClick={() => setMenuOpen(false)}
          >
            {ctaLabel}
          </Link>
        </div>
      )}
    </header>
  )
}

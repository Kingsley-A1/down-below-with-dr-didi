'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { siteConfig } from '@/lib/site-config'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/library', label: 'Library' },
  { href: '/about', label: 'About' },
  { href: '/vault', label: 'V-Vault' },
  { href: '/outreach', label: 'Outreach' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? '#fff' : 'transparent',
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
            alt="Down Below With Dr. Didi"
            width={44}
            height={44}
            className="rounded-full object-cover"
            priority
          />
          <span
            className="font-heading font-bold text-lg hidden sm:block"
            style={{ color: scrolled ? 'var(--color-primary)' : '#fff' }}
          >
            {siteConfig.shortName}
          </span>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden lg:flex items-center gap-8">
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="font-body font-medium text-sm transition-colors"
                style={{ color: scrolled ? 'var(--color-primary)' : 'rgba(255,255,255,0.9)' }}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Book Now CTA */}
        <div className="hidden lg:block">
          <Link
            href="/contact"
            className="bg-accent text-primary font-body font-semibold text-sm px-5 py-2.5 rounded-full transition-colors"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
          >
            Book Now
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2"
          style={{ color: scrolled ? 'var(--color-primary)' : '#fff' }}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t px-6 py-6 flex flex-col gap-4 shadow-lg" style={{ borderColor: 'var(--color-border)' }}>
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="font-body font-medium text-base py-2 border-b last:border-0"
              style={{ color: 'var(--color-primary)', borderColor: 'var(--color-border)' }}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="mt-2 font-body font-semibold text-sm px-5 py-3 rounded-full text-center transition-colors"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
            onClick={() => setMenuOpen(false)}
          >
            Book Now
          </Link>
        </div>
      )}
    </header>
  )
}

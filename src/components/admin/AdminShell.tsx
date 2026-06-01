'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  ArrowUpRight,
  Activity,
  Bell,
  CalendarDays,
  Crown,
  GalleryHorizontal,
  ImageIcon,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Mic2,
  Newspaper,
  Plus,
  Settings,
  Shield,
  Upload,
  Users,
  UserSquare2,
  X,
} from 'lucide-react'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'
import AdminUploadModal from '@/components/admin/AdminUploadModal'
import { isTopLevelAdmin, type AdminRole } from '@/lib/admin/rbac'
import { siteConfig } from '@/lib/site-config'

type NavLinkItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

type NavSection = {
  title: string
  links: NavLinkItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    links: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Content',
    links: [
      { href: '/admin/settings', label: 'Site Settings', icon: Settings },
      { href: '/admin/team', label: 'Team Members', icon: UserSquare2 },
      { href: '/admin/library', label: 'Health Library', icon: Newspaper },
      { href: '/admin/gallery', label: 'Gallery Images', icon: GalleryHorizontal },
      { href: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
      { href: '/admin/podcast', label: 'Podcast Episodes', icon: Mic2 },
      { href: '/admin/events', label: 'Events', icon: CalendarDays },
    ],
  },
  {
    title: 'Operations',
    links: [
      { href: '/admin/users', label: 'User Management', icon: Users },
      { href: '/admin/vault', label: 'V-Vault Moderation', icon: Shield },
      { href: '/admin/alerts', label: 'Site Alerts', icon: Bell },
      { href: '/admin/media', label: 'Media Library', icon: ImageIcon },
      { href: '/admin/admin-users', label: 'Admin Accounts', icon: Crown },
      { href: '/admin/health', label: 'Platform Health', icon: Activity },
    ],
  },
]

function getFocusableElements(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  )
}

function isActivePath(pathname: string, href: string) {
  if (href === '/admin') {
    return pathname === '/admin'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

function AdminNav({
  pathname,
  onNavigate,
  onUpload,
  role,
  showSignOut = true,
}: {
  pathname: string
  onNavigate?: () => void
  onUpload: () => void
  role: AdminRole
  showSignOut?: boolean
}) {
  return (
    <nav className="space-y-5" aria-label="Admin navigation">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title} className="space-y-2">
          <p className="px-3 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            {section.title}
          </p>
          <div className="space-y-1.5">
            {section.links.filter((link) => {
              // Admin account management and the health dashboard are top-level
              // (super_admin / founder_admin) only.
              if (link.href === '/admin/admin-users') {
                return isTopLevelAdmin(role)
              }

              if (link.href === '/admin/health') {
                return isTopLevelAdmin(role)
              }

              if (link.href === '/admin/library') {
                return isTopLevelAdmin(role)
              }

              // Alerts are content any admin (moderator and up) can manage.
              return true
            }).map((link) => {
              const active = isActivePath(pathname, link.href)
              const Icon = link.icon

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  className={`admin-interactive flex items-center gap-2.5 rounded-xl border px-3 py-2.5 font-body text-sm font-semibold transition-colors ${
                    active
                      ? 'border-[rgba(11,78,65,0.2)] bg-[var(--color-primary-muted)] text-[var(--color-primary)] shadow-sm'
                      : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}

      <div className="border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={onUpload}
          className="admin-interactive mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-body text-sm font-semibold text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Asset</span>
        </button>

        <Link
          href="/"
          onClick={onNavigate}
          className="admin-interactive flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-body text-sm font-semibold text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900"
        >
          <span>View Main Platform</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>

        {showSignOut ? (
          <AdminSignOutButton className="admin-interactive mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-center font-body text-sm font-semibold text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900" />
        ) : null}
      </div>
    </nav>
  )
}

export default function AdminShell({
  children,
  email,
  role,
}: {
  children: React.ReactNode
  email: string
  role: AdminRole
}) {
  const pathname = usePathname() || '/admin'
  const [navOpen, setNavOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const navPanelRef = useRef<HTMLElement | null>(null)
  const navCloseButtonRef = useRef<HTMLButtonElement | null>(null)
  const lastFocusedElementRef = useRef<HTMLElement | null>(null)

  function handleNavToggle() {
    setNavOpen(true)
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setNavOpen(false), 0)
    return () => window.clearTimeout(timeoutId)
  }, [pathname])

  useEffect(() => {
    if (!navOpen) {
      return
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    lastFocusedElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    navCloseButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setNavOpen(false)
        return
      }

      if (event.key !== 'Tab' || !navPanelRef.current) {
        return
      }

      const focusable = getFocusableElements(navPanelRef.current)

      if (focusable.length === 0) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      lastFocusedElementRef.current?.focus()
    }
  }, [navOpen])

  return (
    <div className="min-h-screen bg-(--color-surface) admin-fade-in">
      <header className="sticky top-0 z-50 border-b border-(--color-border) bg-white/95 backdrop-blur">
        <div className="max-w-container mx-auto flex items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={handleNavToggle}
              className="admin-interactive inline-flex h-10 w-10 items-center justify-center text-slate-700"
              aria-label={navOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={navOpen}
              aria-controls="admin-nav-panel"
            >
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Image
              src="/logo.jpg"
              alt=""
              width={40}
              height={40}
              className="hidden rounded-full border border-[rgba(11,78,65,0.14)] object-cover sm:block"
            />
            <div className="min-w-0">
              <p className="truncate font-heading text-xl font-bold text-slate-900 md:text-2xl">Admin Console</p>
              <p className="truncate font-body text-xs text-slate-500 md:text-sm">Global content and operations control</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="font-body text-[11px] uppercase tracking-[0.18em] text-slate-400">{role.replace('_', ' ')}</p>
            </div>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="admin-interactive hidden items-center gap-2 rounded-full bg-slate-900 px-4 py-2 font-body text-sm font-semibold text-white lg:inline-flex"
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="admin-interactive inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white lg:hidden"
              aria-label="Upload media"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {navOpen ? (
        <div className="fixed inset-0 z-60 overflow-hidden" role="dialog" aria-modal="true" aria-label="Admin navigation menu">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation menu"
          />
          <aside
            id="admin-nav-panel"
            ref={navPanelRef}
            className="admin-dialog-enter absolute left-0 top-0 h-[100dvh] max-h-[100dvh] w-[86%] max-w-xs overflow-y-auto overscroll-contain border-r border-[rgba(11,78,65,0.16)] bg-white p-4 pb-6 shadow-2xl sm:max-w-sm lg:w-[320px] lg:max-w-[320px]"
          >
            <div className="mb-4 rounded-2xl border border-[rgba(11,78,65,0.14)] bg-[var(--color-primary-muted)] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Image
                    src="/logo.jpg"
                    alt=""
                    width={42}
                    height={42}
                    className="rounded-full border border-white object-cover shadow-sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-heading text-sm font-bold text-[var(--color-primary)]">{siteConfig.shortName}</p>
                    <p className="truncate font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Admin Console
                    </p>
                  </div>
                </div>
                <button
                  ref={navCloseButtonRef}
                  type="button"
                  onClick={() => setNavOpen(false)}
                  className="admin-interactive inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(11,78,65,0.18)] bg-white text-slate-700"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mb-4">
              <p className="font-heading text-lg font-bold text-slate-900">Navigation</p>
            </div>
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="truncate font-body text-xs text-slate-500">Signed in as</p>
              <p className="truncate font-body text-sm font-semibold text-slate-800">{email}</p>
              <p className="mt-1 font-body text-[11px] uppercase tracking-[0.18em] text-slate-500">{role.replace('_', ' ')}</p>
            </div>
            <AdminNav pathname={pathname} role={role} onNavigate={() => setNavOpen(false)} onUpload={() => setUploadOpen(true)} />
          </aside>
        </div>
      ) : null}

      <div className="max-w-container mx-auto px-4 py-6 md:px-6 lg:py-8">
        <div className="min-w-0">{children}</div>
      </div>

      <AdminUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  )
}

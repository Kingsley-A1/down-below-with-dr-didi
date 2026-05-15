'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'

export type AdminDashboardSummarySnapshot = {
  adminUsers: number
  platformUsers: number
  mediaAssets: number
  auditLogs: number
  vaultSubmissions: number
  contactSubmissions: number
  teamMembers: number
  galleryImages: number
  podcastEpisodes: number
  outreachEvents: number
  activeAlerts: number
  databaseReady: boolean
}

type ModuleCard = {
  id: string
  title: string
  href: string
  description: string
  metricLabel: string
  metricValue: number
  status: 'live' | 'attention'
  highlights: string[]
}

function getFocusableElements(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  )
}

export default function AdminDashboardCards({ summary }: { summary: AdminDashboardSummarySnapshot }) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)

  const cards = useMemo<ModuleCard[]>(
    () => [
      {
        id: 'settings',
        title: 'Site Settings',
        href: '/admin/settings',
        description: 'Manage core brand copy, contact channels, homepage hero data, and footer messaging.',
        metricLabel: 'Audit events',
        metricValue: summary.auditLogs,
        status: 'live',
        highlights: ['Global brand controls', 'Homepage and contact alignment', 'Core publishing surface'],
      },
      {
        id: 'alerts',
        title: 'Site Alerts',
        href: '/admin/alerts',
        description: 'Control the running public notice under the header with message, speed, duration, and schedule.',
        metricLabel: 'Active alerts',
        metricValue: summary.activeAlerts,
        status: 'live',
        highlights: ['Public header ticker', 'Speed and duration controls', 'Active history and scheduling'],
      },
      {
        id: 'media',
        title: 'Media Library',
        href: '/admin/media',
        description: 'Upload and govern reusable media assets for team, gallery, podcast, and hero sections.',
        metricLabel: 'Assets tracked',
        metricValue: summary.mediaAssets,
        status: 'live',
        highlights: ['R2 object lifecycle', 'Dependency-safe deletion', 'Alt text and metadata storage'],
      },
      {
        id: 'vault',
        title: 'V-Vault Moderation',
        href: '/admin/vault',
        description: 'Triage and moderate private submissions before educational publication decisions.',
        metricLabel: 'Submissions',
        metricValue: summary.vaultSubmissions,
        status: summary.databaseReady ? 'live' : 'attention',
        highlights: ['Moderation workflow', 'SOP-backed state changes', 'FAQ routing support'],
      },
      {
        id: 'podcast',
        title: 'Podcast Episodes',
        href: '/admin/podcast',
        description: 'Publish episodes, manage metadata, and control public podcast listing order.',
        metricLabel: 'Episodes',
        metricValue: summary.podcastEpisodes,
        status: 'live',
        highlights: ['Audio publishing', 'Structured metadata', 'Category-aware listing'],
      },
      {
        id: 'events',
        title: 'Events',
        href: '/admin/events',
        description: 'Schedule and manage live streams, event history, and engagement settings.',
        metricLabel: 'Events',
        metricValue: summary.outreachEvents,
        status: 'live',
        highlights: ['Live + upcoming support', 'YouTube/Facebook stream links', 'Engagement toggles and moderation'],
      },
      {
        id: 'team',
        title: 'Team Members',
        href: '/admin/team',
        description: 'Maintain bios, credentials, and profile media with ordering and status control.',
        metricLabel: 'Profiles',
        metricValue: summary.teamMembers,
        status: 'live',
        highlights: ['Tiered team management', 'Slug and status controls', 'Image workflow integration'],
      },
      {
        id: 'gallery',
        title: 'Gallery Images',
        href: '/admin/gallery',
        description: 'Curate outreach imagery with captions, categories, and publication visibility.',
        metricLabel: 'Images',
        metricValue: summary.galleryImages,
        status: 'live',
        highlights: ['Category tagging', 'Publication status states', 'Upload-first curation flow'],
      },
      {
        id: 'users',
        title: 'User Management',
        href: '/admin/users',
        description: 'Review, activate, and deactivate platform users with audit-aware governance.',
        metricLabel: 'Platform users',
        metricValue: summary.platformUsers,
        status: 'live',
        highlights: ['Search and filters', 'Safety controls on activation', 'Integrated audit trail'],
      },
      {
        id: 'operations',
        title: 'Operations Signals',
        href: '/admin',
        description: 'Track core support volume and admin access footprint in one operational view.',
        metricLabel: 'Contact submissions',
        metricValue: summary.contactSubmissions,
        status: summary.databaseReady ? 'live' : 'attention',
        highlights: ['Contact traffic visibility', 'Admin activity checks', 'Readiness posture reference'],
      },
    ],
    [summary]
  )

  const activeCard = activeCardId ? cards.find((card) => card.id === activeCardId) || null : null

  useEffect(() => {
    if (!activeCard) {
      return
    }

    lastFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setActiveCardId(null)
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return
      }

      const focusable = getFocusableElements(dialogRef.current)
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
      lastFocusedRef.current?.focus()
    }
  }, [activeCard])

  useEffect(() => {
    if (!activeCard) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [activeCard])

  const activeCardDialog = activeCard ? (
    <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto overscroll-contain p-4 py-6" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close module details"
        onClick={() => setActiveCardId(null)}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
      />
      <div ref={dialogRef} className="admin-dialog-enter relative z-61 flex max-h-[min(720px,calc(100vh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-2xl">
        <div className="bg-slate-950 px-6 py-5 text-white">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-slate-300">Module details</p>
          <h3 className="mt-2 font-heading text-3xl font-bold">{activeCard.title}</h3>
          <p className="mt-2 font-body text-sm text-slate-300">{activeCard.description}</p>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-body text-xs uppercase tracking-[0.18em] text-slate-500">Primary metric</p>
            <p className="mt-1 font-heading text-3xl font-bold text-slate-900">{activeCard.metricValue}</p>
            <p className="font-body text-sm text-slate-600">{activeCard.metricLabel}</p>
          </div>

          <div className="space-y-2">
            <p className="font-body text-xs uppercase tracking-[0.18em] text-slate-500">What this module controls</p>
            {activeCard.highlights.map((highlight) => (
              <p key={highlight} className="rounded-xl border border-slate-200 px-3 py-2 font-body text-sm text-slate-700">
                {highlight}
              </p>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-5">
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setActiveCardId(null)}
              className="admin-interactive rounded-full border border-slate-300 px-4 py-2 font-body text-sm font-semibold text-slate-700"
            >
              Close
            </button>
            <Link
              href={activeCard.href}
              className="admin-interactive rounded-full bg-slate-900 px-4 py-2 font-body text-sm font-semibold text-white"
            >
              Open module
            </Link>
          </div>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 admin-fade-in">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setActiveCardId(card.id)}
            className="admin-interactive group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-[0_4px_14px_rgba(2,12,27,0.06)] transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_14px_30px_rgba(2,12,27,0.10)] sm:p-5"
          >
            <div className="pointer-events-none absolute -right-10 -top-8 h-28 w-28 rounded-full bg-linear-to-br from-slate-100 to-transparent" />
            <p className="font-body text-xs uppercase tracking-[0.2em] text-slate-400">{card.metricLabel}</p>
            <p className="mt-1 font-heading text-3xl font-bold text-slate-900 sm:text-4xl">{card.metricValue}</p>
            <h2 className="mt-3 font-heading text-lg font-bold text-slate-900 sm:mt-4 sm:text-xl">{card.title}</h2>
            <p className="mt-1.5 font-body text-xs text-slate-600 sm:mt-2 sm:text-sm">{card.description}</p>
            <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 font-body text-[11px] font-semibold uppercase tracking-[0.14em] ${
              card.status === 'live' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-700'
            }`}>
              {card.status}
            </span>
            <p className="mt-3 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 group-hover:text-slate-900 sm:mt-4 sm:text-xs">
              Open details
            </p>
          </button>
        ))}
      </section>

      {activeCardDialog && typeof document !== 'undefined' ? createPortal(activeCardDialog, document.body) : null}
    </>
  )
}

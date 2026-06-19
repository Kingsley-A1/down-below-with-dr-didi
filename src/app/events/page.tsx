import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Heart, MapPin, MessageCircle, Radio, Sparkles } from 'lucide-react'
import { getPublishedEvents, type PublicEventRecord } from '@/lib/events/repository'
import { canonicalUrl } from '@/lib/site-config'
import { publicHeroGradient } from '@/lib/public-hero'

export const metadata: Metadata = {
  title: 'Events',
  description: 'Watch live, explore upcoming events, and stay connected with Dr. Didi community programs.',
  alternates: {
    canonical: canonicalUrl('/events'),
  },
  openGraph: {
    title: 'Events',
    description: 'Watch live, explore upcoming events, and stay connected with Dr. Didi community programs.',
    url: canonicalUrl('/events'),
    type: 'website',
    images: [
      {
        url: '/logo.jpg',
        alt: 'DownBelow with Dr. Didi',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Events',
    description: 'Watch live, explore upcoming events, and stay connected with Dr. Didi community programs.',
    images: ['/logo.jpg'],
  },
}

export const dynamic = 'force-dynamic'

function formatDate(value: string | null) {
  if (!value) {
    return 'Date to be announced'
  }

  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function pickFeatured(events: PublicEventRecord[]) {
  if (events.length === 0) {
    return null
  }

  const now = Date.now()
  const upcoming = events.find((event) => event.scheduledAt && new Date(event.scheduledAt).getTime() >= now)
  return upcoming || events[0]
}

function getEventState(event: PublicEventRecord) {
  if (event.isLive) {
    return {
      label: 'Live now',
      className: 'bg-rose-50 text-rose-700 ring-rose-200',
      dotClassName: 'bg-rose-600',
    }
  }

  if (event.scheduledAt && new Date(event.scheduledAt).getTime() >= Date.now()) {
    return {
      label: 'Upcoming',
      className: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      dotClassName: 'bg-emerald-600',
    }
  }

  return {
    label: 'Past event',
    className: 'bg-slate-100 text-slate-700 ring-slate-200',
    dotClassName: 'bg-slate-500',
  }
}

export default async function EventsPage() {
  let events: PublicEventRecord[] = []

  try {
    events = await getPublishedEvents()
  } catch {
    events = []
  }

  const featured = pickFeatured(events)
  const liveEvent = events.find((event) => event.isLive)
  const remaining = featured ? events.filter((event) => event.id !== featured.id) : []
  const featuredState = featured ? getEventState(featured) : null

  return (
    <>
      <section className="pt-32 pb-16 text-white" style={{ background: publicHeroGradient('events') }}>
        <div className="max-w-container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' }}>
            <Sparkles className="h-4 w-4" />
            Community Moments
          </div>
          <h1 className="mt-5 font-heading text-5xl font-bold leading-tight">Events & Live Streams</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base" style={{ color: 'rgba(255,255,255,0.78)' }}>
            Track upcoming community sessions, watch live events, and stay engaged with every outreach milestone.
          </p>
        </div>
      </section>

      <main className="py-14" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-container mx-auto space-y-8 px-6">
          {liveEvent ? (
            <section className="rounded-2xl border bg-rose-50 px-5 py-4" style={{ borderColor: '#fecdd3' }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-rose-700">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-600" />
                  <p className="text-sm font-semibold uppercase tracking-[0.12em]">Live Now</p>
                </div>
                <Link href={`/events/${liveEvent.slug}`} className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white">
                  Watch now
                </Link>
              </div>
              <p className="mt-2 text-base font-semibold text-rose-900">{liveEvent.title}</p>
            </section>
          ) : null}

          {featured && featuredState ? (
            <section className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_minmax(0,1fr)]">
                <div className="relative min-h-75 bg-slate-100">
                  {featured.coverImageUrl ? (
                    <Image src={featured.coverImageUrl} alt={featured.coverImageAlt || featured.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 55vw" priority />
                  ) : (
                    <div className="flex h-full min-h-75 items-center justify-center bg-slate-900 text-white">
                      <Radio className="h-12 w-12 opacity-70" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Featured Event</p>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${featuredState.className}`}>
                      <span className={`h-2 w-2 rounded-full ${featuredState.dotClassName}`} />
                      {featuredState.label}
                    </span>
                  </div>
                  <h2 className="mt-2 font-heading text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>{featured.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{featured.summary}</p>
                  <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />{formatDate(featured.scheduledAt)}</span>
                    {featured.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{featured.location}</span> : null}
                    {featured.streamUrl ? <span className="inline-flex items-center gap-1"><Radio className="h-4 w-4" />Stream enabled</span> : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><Heart className="h-4 w-4" />{featured._count.likes} likes</span>
                    <span className="inline-flex items-center gap-1"><MessageCircle className="h-4 w-4" />{featured._count.comments} comments</span>
                  </div>
                  <Link href={`/events/${featured.slug}`} className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                    View event
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="font-heading text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>No published events yet</h2>
              <p className="mt-2 text-sm text-slate-600">Published events will appear here as soon as the team pushes them live.</p>
            </section>
          )}

          {remaining.length > 0 ? (
            <section>
              <h3 className="mb-4 font-heading text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>All Events</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {remaining.map((event) => {
                  const state = getEventState(event)

                  return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="group rounded-2xl border bg-white p-4 transition-shadow hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <div className="relative mb-3 h-40 overflow-hidden rounded-xl bg-slate-100">
                      {event.coverImageUrl ? (
                        <Image src={event.coverImageUrl} alt={event.coverImageAlt || event.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-slate-100 text-slate-400">
                          <Radio className="h-8 w-8" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${state.className}`}>
                      <span className={`h-2 w-2 rounded-full ${state.dotClassName}`} />
                      {state.label}
                    </span>
                    <h4 className="mt-1 line-clamp-2 font-heading text-lg font-bold text-slate-900">{event.title}</h4>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{event.summary}</p>
                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      <p className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />{formatDate(event.scheduledAt)}</p>
                      {event.location ? <p className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{event.location}</p> : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1"><Heart className="h-4 w-4" />{event._count.likes}</span>
                      <span className="inline-flex items-center gap-1"><MessageCircle className="h-4 w-4" />{event._count.comments}</span>
                    </div>
                  </Link>
                  )
                })}
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </>
  )
}

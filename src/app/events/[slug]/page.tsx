import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react'
import CommentForm from '@/components/events/CommentForm'
import CommentThread from '@/components/events/CommentThread'
import EventStreamEmbed from '@/components/events/EventStreamEmbed'
import LikeButton from '@/components/events/LikeButton'
import ShareMenu from '@/components/events/ShareMenu'
import { getSession } from '@/lib/auth/session'
import { canonicalUrl } from '@/lib/site-config'
import {
  getEventBySlug,
  getVisibleComments,
  hasUserLikedEvent,
  type PublicEventRecord,
} from '@/lib/events/repository'

interface Props {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

function splitBlocks(value: string | null) {
  if (!value) {
    return []
  }

  return value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
}

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

async function loadEvent(slug: string): Promise<PublicEventRecord | null> {
  try {
    return await getEventBySlug(slug)
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const event = await loadEvent(slug)

  if (!event) {
    return { title: 'Event Not Found' }
  }

  const ogImage = event.coverImageUrl || '/logo.jpg'

  return {
    title: event.title,
    description: event.summary,
    alternates: {
      canonical: canonicalUrl(`/events/${event.slug}`),
    },
    openGraph: {
      title: event.title,
      description: event.summary,
      url: canonicalUrl(`/events/${event.slug}`),
      type: 'article',
      images: [{ url: ogImage, alt: event.coverImageAlt || event.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: event.summary,
      images: [ogImage],
    },
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params
  const event = await loadEvent(slug)

  if (!event) {
    notFound()
  }

  const session = await getSession()
  const isAuthenticated = Boolean(session)
  const initialLiked = session ? await hasUserLikedEvent(event.id, session.userId) : false
  const comments = await getVisibleComments(event.id)
  const bodyBlocks = splitBlocks(event.body)
  const publicUrl = canonicalUrl(`/events/${event.slug}`)

  return (
    <>
      <section className="pt-28 pb-14 text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-container mx-auto px-6">
          <Link href="/events" className="mb-8 inline-flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Link>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-white/10">
              {event.coverImageUrl ? (
                <Image src={event.coverImageUrl} alt={event.coverImageAlt || event.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 320px" priority />
              ) : null}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.72)' }}>
                {event.isLive ? 'Live Event' : 'Event'}
              </p>
              <h1 className="mt-2 font-heading text-4xl font-bold text-white sm:text-5xl">{event.title}</h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.78)' }}>{event.summary}</p>
              <div className="mt-5 flex flex-wrap gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />{formatDate(event.scheduledAt)}</span>
                {event.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{event.location}</span> : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="py-14" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="mx-auto max-w-4xl space-y-8 px-6">
          <EventStreamEmbed
            streamUrl={event.streamUrl}
            streamProvider={event.streamProvider}
            title={event.title}
            isLive={event.isLive}
          />

          <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: 'var(--color-border)' }}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <LikeButton
                eventSlug={event.slug}
                initialCount={event._count.likes}
                initialLiked={initialLiked}
                disabled={!event.engagementEnabled}
              />
              <ShareMenu title={event.title} url={publicUrl} />
            </div>
            <a href="#comments" className="text-sm font-semibold text-slate-700 underline underline-offset-2">{event._count.comments} comment(s)</a>
          </section>

          {bodyBlocks.length > 0 ? (
            <article className="space-y-5 rounded-2xl border bg-white p-6" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="font-heading text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>Event Details</h2>
              {bodyBlocks.map((block) => (
                <p key={block} className="text-base leading-relaxed text-slate-700">{block}</p>
              ))}
            </article>
          ) : null}

          <section id="comments" className="space-y-4 rounded-2xl border bg-white p-6" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="font-heading text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>Comments</h2>
            <CommentForm eventSlug={event.slug} isAuthenticated={isAuthenticated} />
            <CommentThread eventSlug={event.slug} initialComments={comments} />
          </section>
        </div>
      </main>
    </>
  )
}

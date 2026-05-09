import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Download, Headphones, Music, PlayCircle } from 'lucide-react'
import { getPublishedPodcastEpisodes, type PublicPodcastEpisode } from '@/lib/admin/repository'
import { formatDate } from '@/lib/utils'
import { canonicalUrl } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Podcast',
  description:
    'Listen to Down Below podcast episodes on reproductive health, community care, faith, and practical wellness with Dr. Didi.',
  alternates: {
    canonical: canonicalUrl('/podcast'),
  },
}

export const dynamic = 'force-dynamic'

function formatDuration(seconds: number | null) {
  if (!seconds) return 'Listen now'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export default async function PodcastPage() {
  let episodes: PublicPodcastEpisode[]

  try {
    episodes = await getPublishedPodcastEpisodes()
  } catch {
    episodes = []
  }

  return (
    <>
      <section className="pt-32 pb-16 text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-container mx-auto px-6">
          <div className="max-w-2xl">
            <div
              className="inline-flex items-center gap-2 text-sm font-body px-4 py-1.5 rounded-full mb-6"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.72)' }}
            >
              <Headphones size={15} />
              Down Below Podcast
            </div>
            <h1 className="font-heading font-bold text-white mb-4" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)' }}>
              Conversations that <span style={{ color: 'var(--color-accent)' }}>heal</span>.
            </h1>
            <p className="font-body text-base max-w-xl" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Calm, practical audio guidance for women, families, and communities.
            </p>
          </div>
        </div>
      </section>

      <main className="py-14 sm:py-16" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-container mx-auto px-6">
          {episodes.length === 0 ? (
            <section className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: 'var(--color-border)' }}>
              <Music className="mx-auto mb-4 h-10 w-10" style={{ color: 'var(--color-primary)' }} />
              <h2 className="font-heading text-2xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
                Episodes are coming soon
              </h2>
              <p className="font-body text-sm text-gray-600 max-w-md mx-auto">
                The podcast system is ready. Published episodes will appear here once the team uploads the first audio release.
              </p>
            </section>
          ) : (
            <div className="space-y-5">
              {episodes.map((episode, index) => (
                <PodcastEpisodeCard key={episode.id} episode={episode} priority={index === 0} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

function PodcastEpisodeCard({
  episode,
  priority,
}: {
  episode: PublicPodcastEpisode
  priority: boolean
}) {
  return (
    <article className="bg-white rounded-2xl border p-4 sm:p-5" style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start">
        <Link href={`/podcast/${episode.slug}`} className="relative block aspect-square overflow-hidden rounded-xl bg-primary-muted">
          {episode.coverImage ? (
            <Image
              src={episode.coverImage}
              alt={episode.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 180px"
              priority={priority}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Music size={40} style={{ color: 'var(--color-primary)' }} />
            </div>
          )}
        </Link>

        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-3 font-body text-xs text-gray-500">
            {episode.publishedAt ? (
              <span className="inline-flex items-center gap-1">
                <Calendar size={13} />
                {formatDate(episode.publishedAt)}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <PlayCircle size={13} />
              {formatDuration(episode.duration)}
            </span>
            {episode.guestName ? <span>Guest: {episode.guestName}</span> : null}
          </div>

          <Link href={`/podcast/${episode.slug}`}>
            <h2 className="font-heading text-2xl font-bold transition-colors hover:text-primary-light" style={{ color: 'var(--color-primary)' }}>
              {episode.title}
            </h2>
          </Link>
          <p className="mt-2 font-body text-sm leading-relaxed text-gray-600">{episode.summary}</p>

          {episode.topicTags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {episode.topicTags.map((tag) => (
                <span key={tag} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <audio controls preload="none" src={episode.audioUrl} className="mt-5 w-full" />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <a
              href={episode.audioUrl}
              download
              className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-body text-sm font-semibold"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
            >
              <Download size={16} />
              Download episode
            </a>
            <Link
              href={`/podcast/${episode.slug}`}
              className="inline-flex items-center justify-center rounded-full border px-5 py-3 font-body text-sm font-semibold"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}
            >
              Show notes
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

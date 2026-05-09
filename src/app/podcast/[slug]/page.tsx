import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Download, ExternalLink, Music, PlayCircle } from 'lucide-react'
import {
  getPodcastEpisodeBySlug,
  getPublishedPodcastEpisodes,
  type PublicPodcastEpisode,
} from '@/lib/admin/repository'
import { formatDate } from '@/lib/utils'
import MedicalDisclaimer from '@/components/content/MedicalDisclaimer'
import { canonicalUrl } from '@/lib/site-config'

interface Props {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

function formatDuration(seconds: number | null) {
  if (!seconds) return 'Listen now'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function splitBlocks(value: string) {
  return value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
}

async function loadEpisode(slug: string) {
  try {
    return await getPodcastEpisodeBySlug(slug)
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const episode = await loadEpisode(slug)

  if (!episode) {
    return { title: 'Podcast Episode Not Found' }
  }

  return {
    title: episode.title,
    description: episode.summary,
    alternates: {
      canonical: canonicalUrl(`/podcast/${episode.slug}`),
    },
    openGraph: {
      title: episode.title,
      description: episode.summary,
      url: canonicalUrl(`/podcast/${episode.slug}`),
      type: 'article',
      publishedTime: episode.publishedAt ?? undefined,
      images: episode.coverImage ? [{ url: episode.coverImage, alt: episode.title }] : undefined,
    },
  }
}

export default async function PodcastEpisodePage({ params }: Props) {
  const { slug } = await params
  const episode = await loadEpisode(slug)

  if (!episode) {
    notFound()
  }

  let related: PublicPodcastEpisode[] = []
  try {
    related = (await getPublishedPodcastEpisodes()).filter((item) => item.slug !== episode.slug).slice(0, 3)
  } catch {
    related = []
  }

  const showNoteBlocks = splitBlocks(episode.description)
  const transcriptBlocks = episode.transcript ? splitBlocks(episode.transcript) : []

  return (
    <>
      <section className="pt-28 pb-12 text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-container mx-auto px-6">
          <Link href="/podcast" className="mb-8 inline-flex items-center gap-2 font-body text-sm" style={{ color: 'rgba(255,255,255,0.72)' }}>
            <ArrowLeft size={16} />
            Back to Podcast
          </Link>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-white/10">
              {episode.coverImage ? (
                <Image src={episode.coverImage} alt={episode.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 320px" priority />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Music size={58} style={{ color: 'var(--color-accent)' }} />
                </div>
              )}
            </div>
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3 font-body text-xs" style={{ color: 'rgba(255,255,255,0.72)' }}>
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
              <h1 className="font-heading font-bold text-white mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}>
                {episode.title}
              </h1>
              <p className="font-body text-base leading-relaxed max-w-2xl" style={{ color: 'rgba(255,255,255,0.74)' }}>
                {episode.summary}
              </p>
              {episode.topicTags.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {episode.topicTags.map((tag) => (
                    <span key={tag} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--color-accent)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <main className="py-14" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-4xl mx-auto px-6">
          <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <audio controls preload="metadata" src={episode.audioUrl} className="w-full" />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <a
                href={episode.audioUrl}
                download
                className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-body text-sm font-semibold"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
              >
                <Download size={16} />
                Download audio
              </a>
              {episode.externalSourceUrl ? (
                <a
                  href={episode.externalSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 font-body text-sm font-semibold"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}
                >
                  <ExternalLink size={16} />
                  Open source
                </a>
              ) : null}
            </div>
          </section>

          <div className="mt-6">
            <MedicalDisclaimer compact />
          </div>

          <article className="mt-10">
            <h2 className="font-heading text-2xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              Show Notes
            </h2>
            <div className="space-y-5">
              {showNoteBlocks.map((block) => (
                <p key={block} className="font-body text-base leading-relaxed text-gray-700">
                  {block}
                </p>
              ))}
            </div>
          </article>

          {transcriptBlocks.length > 0 ? (
            <section className="mt-12 rounded-2xl border bg-white p-6" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="font-heading text-2xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
                Transcript
              </h2>
              <div className="space-y-4">
                {transcriptBlocks.map((block) => (
                  <p key={block} className="font-body text-sm leading-relaxed text-gray-700">
                    {block}
                  </p>
                ))}
              </div>
            </section>
          ) : null}

          {related.length > 0 ? (
            <section className="mt-14 border-t pt-10" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="font-heading text-2xl font-bold mb-5" style={{ color: 'var(--color-primary)' }}>
                More Episodes
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {related.map((item) => (
                  <Link key={item.id} href={`/podcast/${item.slug}`} className="rounded-xl border bg-white p-4" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="font-heading font-semibold text-base line-clamp-2" style={{ color: 'var(--color-primary)' }}>
                      {item.title}
                    </p>
                    <p className="mt-2 font-body text-xs text-gray-500">{formatDuration(item.duration)}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </>
  )
}

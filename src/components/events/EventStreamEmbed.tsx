import { detectStreamProvider, toEmbedUrl } from '@/lib/events/stream-utils'

export default function EventStreamEmbed({
  streamUrl,
  streamProvider,
  title,
  isLive,
}: {
  streamUrl: string | null
  streamProvider: string | null
  title: string
  isLive: boolean
}) {
  if (!streamUrl) {
    return null
  }

  const provider = (streamProvider === 'youtube' || streamProvider === 'facebook')
    ? streamProvider
    : detectStreamProvider(streamUrl)

  if (!provider) {
    return null
  }

  const embedUrl = toEmbedUrl(streamUrl, provider)

  if (!embedUrl) {
    return null
  }

  return (
    <section className="rounded-2xl border bg-white p-3 sm:p-4" style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
        <iframe
          src={embedUrl}
          title={`${title} livestream`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
          allowFullScreen
          className="h-full w-full border-0"
        />
        {isLive ? (
          <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            Live
          </div>
        ) : null}
      </div>
    </section>
  )
}

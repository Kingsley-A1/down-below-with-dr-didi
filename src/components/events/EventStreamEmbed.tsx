'use client'

import { useRef, useState } from 'react'
import { ExternalLink, Maximize2, Monitor, Smartphone } from 'lucide-react'
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
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape')
  const frameRef = useRef<HTMLDivElement | null>(null)

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

  async function requestFullscreen() {
    await frameRef.current?.requestFullscreen?.()
  }

  const frameShape = orientation === 'landscape'
    ? 'aspect-video'
    : 'mx-auto aspect-[9/16] max-h-[78vh] max-w-[420px]'

  return (
    <section className="rounded-2xl border bg-white p-3 sm:p-4" style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {isLive ? 'Live player' : 'Event video'}
          </p>
          <p className="font-body text-xs text-slate-500">Landscape opens by default. Use fullscreen or the player menu for PiP where supported.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOrientation('landscape')}
            aria-pressed={orientation === 'landscape'}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${orientation === 'landscape' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-700'}`}
            title="Landscape player"
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setOrientation('portrait')}
            aria-pressed={orientation === 'portrait'}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${orientation === 'portrait' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-700'}`}
            title="Portrait player"
          >
            <Smartphone className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              void requestFullscreen()
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700"
            title="Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <a
            href={streamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700"
            title="Open source video"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div ref={frameRef} className={`relative overflow-hidden rounded-xl bg-black ${frameShape}`}>
        <iframe
          src={embedUrl}
          title={`${title} livestream`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
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

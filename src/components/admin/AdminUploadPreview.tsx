import { ExternalLink, FileAudio, ImageIcon, Video } from 'lucide-react'

type AdminUploadPreviewProps = {
  title: string
  className?: string
  eyebrow?: string
  description?: string
  mediaUrl?: string
  mediaType?: 'image' | 'video' | 'audio' | 'document'
  altText?: string
  meta?: Array<string | null | undefined>
  publicHref?: string
}

export default function AdminUploadPreview({
  title,
  className = '',
  eyebrow = 'Public preview',
  description,
  mediaUrl,
  mediaType = 'image',
  altText,
  meta = [],
  publicHref,
}: AdminUploadPreviewProps) {
  const visibleMeta = meta.filter((item): item is string => Boolean(item))

  return (
    <section className={`rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4 ${className}`} aria-label={eyebrow}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{eyebrow}</p>
        {publicHref ? (
          <a
            href={publicHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 font-body text-xs font-semibold text-slate-700"
          >
            Open page
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="relative flex min-h-44 items-center justify-center bg-slate-950">
          {mediaUrl ? (
            mediaType === 'video' ? (
              <video src={mediaUrl} controls preload="metadata" className="max-h-72 w-full object-contain" />
            ) : mediaType === 'audio' ? (
              <div className="w-full space-y-4 p-6 text-center text-white">
                <FileAudio className="mx-auto h-10 w-10 opacity-80" aria-hidden="true" />
                <audio controls preload="none" src={mediaUrl} className="w-full" />
              </div>
            ) : (
              // Blob URLs and admin-selected files cannot be optimized by next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl} alt={altText || title} className="max-h-72 w-full object-contain" />
            )
          ) : (
            <div className="flex flex-col items-center gap-2 p-6 text-center text-slate-300">
              {mediaType === 'video' ? <Video className="h-10 w-10" aria-hidden="true" /> : <ImageIcon className="h-10 w-10" aria-hidden="true" />}
              <p className="font-body text-sm font-semibold">Select media to preview</p>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="line-clamp-2 font-heading text-lg font-bold text-slate-900">{title || 'Untitled content'}</h3>
          {visibleMeta.length > 0 ? (
            <p className="mt-1 font-body text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
              {visibleMeta.join(' / ')}
            </p>
          ) : null}
          {description ? (
            <p className="mt-2 line-clamp-4 font-body text-sm leading-relaxed text-slate-600">{description}</p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

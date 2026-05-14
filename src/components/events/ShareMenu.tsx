'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'

export default function ShareMenu({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // fall back to clipboard and links below
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // ignore clipboard failure silently
    }
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300">WhatsApp</a>
      <a href={x} target="_blank" rel="noopener noreferrer" className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300">X</a>
      <a href={facebook} target="_blank" rel="noopener noreferrer" className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300">Facebook</a>
      {copied ? <span className="text-xs font-semibold text-emerald-700">Link copied</span> : null}
    </div>
  )
}

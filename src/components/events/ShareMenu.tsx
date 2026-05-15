'use client'

import { useState } from 'react'
import { Link as LinkIcon, Share2 } from 'lucide-react'

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12.04 2a9.86 9.86 0 0 0-8.48 14.9L2.5 22l5.22-1.37A9.86 9.86 0 1 0 12.04 2Zm0 1.8a8.06 8.06 0 0 1 6.83 12.35 8.03 8.03 0 0 1-9.6 2.88l-.34-.14-3.1.82.83-3.02-.17-.35A8.06 8.06 0 0 1 12.04 3.8Zm-3.2 3.82c-.18 0-.47.07-.72.34-.25.27-.95.93-.95 2.27 0 1.34.97 2.63 1.11 2.81.14.18 1.9 2.9 4.6 4.06.64.28 1.14.45 1.53.57.64.2 1.23.17 1.69.1.52-.08 1.59-.65 1.82-1.28.22-.63.22-1.17.15-1.28-.07-.11-.25-.18-.52-.32-.27-.14-1.59-.78-1.84-.87-.25-.09-.43-.14-.61.14-.18.27-.7.87-.86 1.05-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.42.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.02-.22-.53-.45-.46-.61-.47h-.53Z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M13.5 22v-8h2.67l.4-3.12H13.5V8.9c0-.9.25-1.52 1.55-1.52h1.65V4.6c-.29-.04-1.27-.12-2.42-.12-2.4 0-4.04 1.46-4.04 4.14v2.26H7.53V14h2.71v8h3.26Z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M17.53 3h3.03l-6.62 7.56L21.73 21h-6.1l-4.78-6.24L5.39 21H2.35l7.08-8.09L1.96 3h6.25l4.31 5.7L17.53 3Zm-1.06 16.16h1.68L7.29 4.74H5.49l10.98 14.42Z" />
    </svg>
  )
}

export default function ShareMenu({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard access can be unavailable in embedded browsers.
    }
  }

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // fall back to clipboard and links below
      }
    }

    await copyLink()
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`

  return (
    <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp" title="WhatsApp" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:border-slate-300">
        <WhatsAppIcon className="h-4 w-4" />
      </a>
      <a href={x} target="_blank" rel="noopener noreferrer" aria-label="Share on X" title="X" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:border-slate-300">
        <XIcon className="h-4 w-4" />
      </a>
      <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" title="Facebook" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:border-slate-300">
        <FacebookIcon className="h-4 w-4" />
      </a>
      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy event link"
        title="Copy link"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:border-slate-300"
      >
        <LinkIcon className="h-4 w-4" />
      </button>
      {copied ? <span className="text-xs font-semibold text-emerald-700">Link copied</span> : null}
    </div>
  )
}

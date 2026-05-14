export type StreamProvider = 'youtube' | 'facebook'

export function detectStreamProvider(url: string): StreamProvider | null {
  const normalized = url.toLowerCase()

  if (normalized.includes('youtube.com') || normalized.includes('youtu.be')) {
    return 'youtube'
  }

  if (normalized.includes('facebook.com') || normalized.includes('fb.watch')) {
    return 'facebook'
  }

  return null
}

/**
 * Convert supported public stream URLs to embed URLs.
 */
export function toEmbedUrl(rawUrl: string, provider: StreamProvider): string | null {
  const trimmed = rawUrl.trim()

  if (!trimmed) {
    return null
  }

  if (provider === 'youtube') {
    const match = trimmed.match(/(?:v=|youtu\.be\/|\/live\/|\/embed\/)([A-Za-z0-9_-]{11})/)
    if (!match) {
      return null
    }

    return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`
  }

  if (provider === 'facebook') {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(trimmed)}&show_text=0&width=auto`
  }

  return null
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { ImageIcon, Video } from 'lucide-react'
import { getPublishedGalleryImages, type PublicGalleryImage, type GalleryImageCategory, type GalleryMediaType } from '@/lib/admin/repository'
import ImageViewModal from '@/components/content/ImageViewModal'
import { canonicalUrl } from '@/lib/site-config'
import { publicHeroGradient } from '@/lib/public-hero'

export const metadata: Metadata = {
  title: 'Gallery',
  description:
    'Photos and videos from DownBelow Family Health Initiatives with Dr. Didi events, community outreach programmes, team activities, and health talks across Nigeria.',
  alternates: {
    canonical: canonicalUrl('/gallery'),
  },
}

export const dynamic = 'force-dynamic'

const CATEGORIES: { value: GalleryImageCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'outreach', label: 'Outreach' },
  { value: 'event', label: 'Events' },
  { value: 'team', label: 'Team' },
  { value: 'community', label: 'Community' },
  { value: 'facility', label: 'Facility' },
]

const MEDIA_TABS: { value: GalleryMediaType; label: string }[] = [
  { value: 'image', label: 'Photos' },
  { value: 'video', label: 'Videos' },
]

const EMPTY_STATE_COPY: Record<GalleryMediaType, {
  title: string
  message: string
  icon: typeof ImageIcon
}> = {
  image: {
    title: 'No photos published yet',
    message: 'Published photos will appear here after the team adds image uploads from outreach, care, teaching, or team moments.',
    icon: ImageIcon,
  },
  video: {
    title: 'No videos published yet',
    message: 'Published videos will appear here after the team adds video uploads from events, education sessions, or outreach work.',
    icon: Video,
  },
}

interface Props {
  searchParams: Promise<{ category?: string; image?: string; type?: string }>
}

export default async function GalleryPage({ searchParams }: Props) {
  const { category: rawCategory, image: imageSlug, type: rawType } = await searchParams
  const validCategories: GalleryImageCategory[] = ['outreach', 'event', 'team', 'community', 'facility']
  const validTypes: GalleryMediaType[] = ['image', 'video']
  const category = validCategories.includes(rawCategory as GalleryImageCategory)
    ? (rawCategory as GalleryImageCategory)
    : undefined
  const activeType: GalleryMediaType = validTypes.includes(rawType as GalleryMediaType)
    ? (rawType as GalleryMediaType)
    : 'image'

  let allImages: PublicGalleryImage[]

  try {
    allImages = await getPublishedGalleryImages()
  } catch {
    allImages = []
  }

  const images = allImages.filter((image) => {
    if (image.mediaType !== activeType) {
      return false
    }

    return category ? image.category === category : true
  })

  const activeCategory = rawCategory && validCategories.includes(rawCategory as GalleryImageCategory)
    ? rawCategory
    : 'all'
  const emptyState = EMPTY_STATE_COPY[activeType]
  const EmptyIcon = emptyState.icon

  function galleryHref(next: { category?: GalleryImageCategory | 'all'; type?: GalleryMediaType }) {
    const params = new URLSearchParams()
    const nextType = next.type ?? activeType
    const nextCategory = next.category ?? activeCategory

    if (nextType !== 'image') {
      params.set('type', nextType)
    }

    if (nextCategory !== 'all') {
      params.set('category', nextCategory)
    }

    const query = params.toString()
    return query ? `/gallery?${query}` : '/gallery'
  }

  return (
    <>
      {/* Page Hero */}
      <section
        className="pt-32 pb-20 relative overflow-hidden"
        style={{ background: publicHeroGradient('gallery') }}
      >
        <div
          className="absolute right-0 top-0 text-[200px] leading-none select-none pointer-events-none"
          style={{ opacity: 0.06 }}
        >
          📸
        </div>
        <div className="max-w-container mx-auto px-6 text-white text-center">
          <div
            className="inline-block text-sm font-body px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
          >
            In Pictures & Video
          </div>
          <h1
            className="font-heading font-bold text-white mb-4"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.2rem)' }}
          >
            Our <span style={{ color: 'var(--color-accent)' }}>Gallery</span>
          </h1>
          <p
            className="font-body text-base max-w-lg mx-auto"
            style={{ color: 'rgba(255,255,255,0.72)' }}
          >
            Visual moments from outreach, care, teaching, and team life.
          </p>
        </div>
      </section>

      <main style={{ backgroundColor: 'var(--color-surface)' }}>
        {/* Filter Bar */}
        <div
          className="sticky top-16 z-20 border-b"
          style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
        >
          <div className="max-w-container mx-auto px-6">
            <div className="flex gap-2 border-b py-3" style={{ borderColor: 'var(--color-border)' }}>
              {MEDIA_TABS.map(({ value, label }) => {
                const isActive = value === activeType
                return (
                  <Link
                    key={value}
                    href={galleryHref({ type: value })}
                    scroll
                    className="font-body text-sm font-semibold px-4 py-2 rounded-full whitespace-nowrap transition-colors"
                    style={{
                      backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-primary-muted)',
                      color: isActive ? '#ffffff' : 'var(--color-primary)',
                    }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {label}
                  </Link>
                )
              })}
            </div>
            <div className="scroll-fade-x flex items-center gap-1 overflow-x-auto py-3 no-scrollbar">
              {CATEGORIES.map(({ value, label }) => {
                const isActive = value === activeCategory
                return (
                  <Link
                    key={value}
                    href={galleryHref({ category: value })}
                    scroll
                    className="font-body text-sm font-medium px-4 py-1.5 rounded-full whitespace-nowrap transition-colors"
                    style={{
                      backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                      color: isActive ? '#ffffff' : 'var(--color-text-muted)',
                    }}
                  >
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Media Grid */}
        <div className="max-w-container mx-auto px-6 py-14">
          {images.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-2xl border bg-white px-6 py-14 text-center shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>
                <EmptyIcon className="h-7 w-7" aria-hidden="true" />
              </div>
              <h2 className="font-heading text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {emptyState.title}
              </h2>
              <p className="mx-auto mt-3 max-w-md font-body text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                {activeCategory === 'all'
                  ? emptyState.message
                  : `No ${emptyState.title.toLowerCase().replace('no ', '').replace(' published yet', '')} are published in ${activeCategory} yet. Try another category or check back after the next update.`}
              </p>
            </div>
          ) : (
            <ImageViewModal key={activeCategory} images={images} initialImageSlug={imageSlug} />
          )}
        </div>
      </main>
    </>
  )
}

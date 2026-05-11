import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedGalleryImages, type PublicGalleryImage, type GalleryImageCategory } from '@/lib/admin/repository'
import ImageViewModal from '@/components/content/ImageViewModal'
import { canonicalUrl } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Gallery',
  description:
    'Photos from DownBelow Family and Health Initiatives with Dr. Didi events, community outreach programmes, team activities, and health talks across Nigeria.',
  alternates: {
    canonical: canonicalUrl('/gallery'),
  },
}

export const dynamic = 'force-dynamic'

const CATEGORIES: { value: GalleryImageCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'outreach', label: 'Outreach' },
  { value: 'event', label: 'Events' },
  { value: 'community', label: 'Community' },
  { value: 'facility', label: 'Facility' },
]

interface Props {
  searchParams: Promise<{ category?: string; image?: string }>
}

export default async function GalleryPage({ searchParams }: Props) {
  const { category: rawCategory, image: imageSlug } = await searchParams
  const validCategories: GalleryImageCategory[] = ['outreach', 'event', 'community', 'facility']
  const category = validCategories.includes(rawCategory as GalleryImageCategory)
    ? (rawCategory as GalleryImageCategory)
    : undefined

  let images: PublicGalleryImage[]

  try {
    images = await getPublishedGalleryImages(category)
  } catch {
    images = []
  }

  const activeCategory = rawCategory && validCategories.includes(rawCategory as GalleryImageCategory)
    ? rawCategory
    : 'all'

  return (
    <>
      {/* Page Hero */}
      <section
        className="pt-32 pb-20 relative overflow-hidden"
        style={{ backgroundColor: 'var(--color-primary)' }}
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
            In Pictures
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
            Visual moments from outreach, care, and team life.
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
            <div className="scroll-fade-x flex items-center gap-1 overflow-x-auto py-3 no-scrollbar">
              {CATEGORIES.map(({ value, label }) => {
                const isActive = value === activeCategory
                const href = value === 'all' ? '/gallery' : `/gallery?category=${value}`
                return (
                  <Link
                    key={value}
                    href={href}
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

        {/* Image Grid */}
        <div className="max-w-container mx-auto px-6 py-14">
          {images.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-body text-base" style={{ color: 'var(--color-text-muted)' }}>
                No {category ?? ''} photos yet. Check back soon.
              </p>
            </div>
          ) : (
            <ImageViewModal images={images} initialImageSlug={imageSlug} />
          )}
        </div>
      </main>
    </>
  )
}

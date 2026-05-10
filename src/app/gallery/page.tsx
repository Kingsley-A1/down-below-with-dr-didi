import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPublishedGalleryImages, type PublicGalleryImage, type GalleryImageCategory } from '@/lib/admin/repository'
import { gallerySeedItems } from '@/data/gallery'
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
  { value: 'team', label: 'Team' },
  { value: 'community', label: 'Community' },
  { value: 'facility', label: 'Facility' },
]

const CATEGORY_BADGE: Record<GalleryImageCategory, { bg: string; text: string }> = {
  outreach:  { bg: '#dcfce7', text: '#166534' },
  event:     { bg: '#fce7f3', text: '#be185d' },
  team:      { bg: '#dbeafe', text: '#1e40af' },
  community: { bg: '#fef9c3', text: '#854d0e' },
  facility:  { bg: '#ede9fe', text: '#7c3aed' },
}

interface Props {
  searchParams: Promise<{ category?: string }>
}

function seedToPublic(item: (typeof gallerySeedItems)[0]): PublicGalleryImage {
  return {
    id: item.slug,
    slug: item.slug,
    title: item.title,
    description: item.description,
    caption: item.caption ?? null,
    imageUrl: item.imageUrl,
    imageAlt: item.imageAlt,
    category: item.category as GalleryImageCategory,
    eventName: item.eventName ?? null,
    location: item.location ?? null,
    capturedAt: null,
    sortOrder: 0,
  }
}

export default async function GalleryPage({ searchParams }: Props) {
  const { category: rawCategory } = await searchParams
  const validCategories: GalleryImageCategory[] = ['outreach', 'event', 'team', 'community', 'facility']
  const category = validCategories.includes(rawCategory as GalleryImageCategory)
    ? (rawCategory as GalleryImageCategory)
    : undefined

  let images: PublicGalleryImage[]

  try {
    images = await getPublishedGalleryImages(category)
  } catch {
    images = []
  }

  if (images.length === 0) {
    const fallback = gallerySeedItems
      .filter((i) => !category || i.category === category)
      .map(seedToPublic)
    images = fallback
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
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {images.map((image) => (
                <GalleryCard key={image.id} image={image} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

function GalleryCard({ image }: { image: PublicGalleryImage }) {
  const badge = CATEGORY_BADGE[image.category]

  return (
    <Link
      href={`/gallery/${image.slug}`}
      className="group block rounded-xl overflow-hidden shadow-sm break-inside-avoid relative"
      style={{ borderRadius: 'var(--radius-md, 0.75rem)' }}
    >
      <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
        <Image
          src={image.imageUrl}
          alt={image.imageAlt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }}
        >
          <span
            className="inline-block text-xs font-body font-semibold px-2 py-0.5 rounded-full mb-2 self-start"
            style={{ backgroundColor: badge.bg, color: badge.text }}
          >
            {image.category.charAt(0).toUpperCase() + image.category.slice(1)}
          </span>
          <p className="font-body font-semibold text-sm text-white line-clamp-2">
            {image.title}
          </p>
        </div>
      </div>
    </Link>
  )
}

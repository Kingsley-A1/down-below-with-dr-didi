import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, Calendar, Tag } from 'lucide-react'
import { getPublishedGalleryImages, getGalleryImageBySlug, type PublicGalleryImage, type GalleryImageCategory } from '@/lib/admin/repository'
import { formatDate } from '@/lib/utils'
import { canonicalUrl } from '@/lib/site-config'

interface Props {
  params: Promise<{ slug: string }>
}

const CATEGORY_BADGE: Record<GalleryImageCategory, { bg: string; text: string }> = {
  outreach:  { bg: '#dcfce7', text: '#166534' },
  event:     { bg: '#fce7f3', text: '#be185d' },
  team:      { bg: '#dbeafe', text: '#1e40af' },
  community: { bg: '#fef9c3', text: '#854d0e' },
  facility:  { bg: '#ede9fe', text: '#7c3aed' },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  let image: PublicGalleryImage | null = null
  try {
    image = await getGalleryImageBySlug(slug)
  } catch {
    /* DB offline — fall through to seed lookup */
  }

  if (!image) {
    return { title: 'Gallery Image Not Found' }
  }

  return {
    title: image.title,
    description: image.description.slice(0, 160),
    alternates: {
      canonical: canonicalUrl(`/gallery/${image.slug}`),
    },
    openGraph: {
      title: image.title,
      description: image.description.slice(0, 160),
      url: canonicalUrl(`/gallery/${image.slug}`),
      images: [{ url: image.imageUrl, alt: image.imageAlt }],
    },
  }
}

export default async function GalleryImagePage({ params }: Props) {
  const { slug } = await params

  let image: PublicGalleryImage | null = null
  let related: PublicGalleryImage[] = []

  try {
    image = await getGalleryImageBySlug(slug)
    if (image) {
      const all = await getPublishedGalleryImages(image.category)
      related = all.filter((i) => i.slug !== slug).slice(0, 3)
    }
  } catch {
    /* DB offline */
  }

  if (!image) {
    notFound()
  }

  const badge = CATEGORY_BADGE[image.category]

  return (
    <>
      <div className="pt-28 pb-4" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="max-w-container mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 font-body text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/gallery" className="hover:text-primary transition-colors">Gallery</Link>
            <span>/</span>
            <span className="line-clamp-1" style={{ color: 'var(--color-text)' }}>{image.title}</span>
          </nav>
        </div>
      </div>

      <main className="pb-20" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-container mx-auto px-6">
          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-start">
            {/* Primary Image */}
            <div className="relative w-full rounded-2xl overflow-hidden shadow-md" style={{ maxHeight: '720px' }}>
              <Image
                src={image.imageUrl}
                alt={image.imageAlt}
                width={1200}
                height={800}
                className="w-full h-auto object-cover"
                style={{ maxHeight: '720px', objectFit: 'cover' }}
                priority
              />
            </div>

            {/* Metadata Panel */}
            <div className="space-y-5 lg:sticky lg:top-24">
              {/* Category badge */}
              <span
                className="inline-block text-xs font-body font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: badge.bg, color: badge.text }}
              >
                {image.category.charAt(0).toUpperCase() + image.category.slice(1)}
              </span>

              {/* Title */}
              <h1 className="font-heading font-bold text-2xl" style={{ color: 'var(--color-text)', lineHeight: 1.3 }}>
                {image.title}
              </h1>

              {/* Description */}
              <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                {image.description}
              </p>

              {/* Meta details */}
              {(image.eventName || image.location || image.capturedAt) && (
                <div
                  className="space-y-2 pt-4 border-t"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  {image.eventName && (
                    <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                      <Tag className="w-4 h-4 shrink-0" />
                      <span className="font-body text-sm">{image.eventName}</span>
                    </div>
                  )}
                  {image.location && (
                    <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="font-body text-sm">{image.location}</span>
                    </div>
                  )}
                  {image.capturedAt && (
                    <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span className="font-body text-sm">{formatDate(image.capturedAt)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Back link */}
              <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <Link
                  href={`/gallery?category=${image.category}`}
                  className="inline-flex items-center gap-2 font-body text-sm font-medium transition-colors hover:text-primary"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Gallery
                </Link>
              </div>
            </div>
          </div>

          {/* Related Images */}
          {related.length > 0 && (
            <section className="mt-20">
              <div className="flex items-center gap-3 mb-8">
                <h2 className="font-heading font-bold text-xl" style={{ color: 'var(--color-text)' }}>
                  More from this category
                </h2>
                <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {related.map((rel) => {
                  const relBadge = CATEGORY_BADGE[rel.category]
                  return (
                    <Link
                      key={rel.id}
                      href={`/gallery/${rel.slug}`}
                      className="group block rounded-xl overflow-hidden shadow-sm"
                    >
                      <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
                        <Image
                          src={rel.imageUrl}
                          alt={rel.imageAlt}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                        <div
                          className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 60%)' }}
                        >
                          <span
                            className="inline-block text-xs font-body font-semibold px-2 py-0.5 rounded-full mb-1.5 self-start"
                            style={{ backgroundColor: relBadge.bg, color: relBadge.text }}
                          >
                            {rel.category.charAt(0).toUpperCase() + rel.category.slice(1)}
                          </span>
                          <p className="font-body font-semibold text-sm text-white line-clamp-2">
                            {rel.title}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  )
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getGalleryImageBySlug } from '@/lib/admin/repository'
import { canonicalUrl } from '@/lib/site-config'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  let image = null

  try {
    image = await getGalleryImageBySlug(slug)
  } catch {
    image = null
  }

  if (!image) {
    return {
      title: 'Gallery Image Not Found',
      alternates: {
        canonical: canonicalUrl('/gallery'),
      },
    }
  }

  return {
    title: image.title,
    description: image.description.slice(0, 160),
    alternates: {
      canonical: canonicalUrl('/gallery'),
    },
    openGraph: {
      title: image.title,
      description: image.description.slice(0, 160),
      url: canonicalUrl(`/gallery?image=${image.slug}`),
      ...(image.mediaType === 'image' ? { images: [{ url: image.imageUrl, alt: image.imageAlt }] } : {}),
    },
  }
}

export default async function GalleryImagePage({ params }: Props) {
  const { slug } = await params
  redirect(`/gallery?image=${encodeURIComponent(slug)}`)
}

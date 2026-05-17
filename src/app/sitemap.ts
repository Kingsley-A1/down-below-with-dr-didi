import type { MetadataRoute } from 'next'
import { getPublishedGalleryImages } from '@/lib/admin/repository'
import { getPublishedEvents } from '@/lib/events/repository'
import { getPublishedLibraryArticles } from '@/lib/library/repository'
import { canonicalUrl } from '@/lib/site-config'

const publicRoutes = [
  { path: '/', priority: 1, changeFrequency: 'weekly' as const },
  { path: '/about', priority: 0.85, changeFrequency: 'monthly' as const },
  { path: '/team', priority: 0.75, changeFrequency: 'monthly' as const },
  { path: '/gallery', priority: 0.75, changeFrequency: 'weekly' as const },
  { path: '/library', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/podcast', priority: 0.75, changeFrequency: 'weekly' as const },
  { path: '/review', priority: 0.72, changeFrequency: 'weekly' as const },
  { path: '/events', priority: 0.85, changeFrequency: 'weekly' as const },
  { path: '/vault', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/outreach', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/contact', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/terms', priority: 0.25, changeFrequency: 'yearly' as const },
  { path: '/privacy', priority: 0.25, changeFrequency: 'yearly' as const },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const routes = publicRoutes.map((route) => ({
    url: canonicalUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  let articleRoutes: MetadataRoute.Sitemap = []
  let galleryRoutes: MetadataRoute.Sitemap = []
  let eventRoutes: MetadataRoute.Sitemap = []

  try {
    const articles = await getPublishedLibraryArticles()
    articleRoutes = articles.map((article) => ({
      url: canonicalUrl(`/library/${article.slug}`),
      lastModified: new Date(article.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.72,
    }))
  } catch {
    articleRoutes = []
  }

  try {
    const galleryImages = await getPublishedGalleryImages()
    galleryRoutes = galleryImages.map((image) => ({
      url: canonicalUrl(`/gallery/${image.slug}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.58,
    }))
  } catch {
    galleryRoutes = []
  }

  try {
    const events = await getPublishedEvents()
    eventRoutes = events.map((event) => ({
      url: canonicalUrl(`/events/${event.slug}`),
      lastModified: new Date(event.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.76,
    }))
  } catch {
    eventRoutes = []
  }

  return [...routes, ...articleRoutes, ...galleryRoutes, ...eventRoutes]
}

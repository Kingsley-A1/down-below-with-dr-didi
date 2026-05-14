import type { MetadataRoute } from 'next'
import { canonicalUrl } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/events', '/events/'],
      disallow: ['/admin/', '/api/admin/'],
    },
    sitemap: canonicalUrl('/sitemap.xml'),
  }
}

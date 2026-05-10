import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DownBelow Family Health Initiative with Dr. Didi',
    short_name: 'DownBelow Family',
    description: 'Non-profit and non-denominational Christian ministry preserving the family unit for God.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b4e41',
    theme_color: '#0b4e41',
    orientation: 'portrait',
    lang: 'en-NG',
    icons: [
      {
        src: '/logo.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/logo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
      {
        src: '/logo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
    ],
  }
}
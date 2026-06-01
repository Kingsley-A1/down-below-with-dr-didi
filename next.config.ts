import type { NextConfig } from 'next'

const isDevelopment = process.env.NODE_ENV === 'development'

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://downbelowwithdrdidi.com https://www.downbelowwithdrdidi.com https://down-below-with-dr-didi.vercel.app https://*.r2.dev https://*.r2.cloudflarestorage.com",
  "font-src 'self' data:",
  // R2 endpoints must be allowed here too: browser uploads PUT the file
  // directly to the presigned R2 URL via XHR, which connect-src governs.
  `connect-src 'self' https://*.r2.dev https://*.r2.cloudflarestorage.com${isDevelopment ? ' ws: http: https:' : ''}`,
  "media-src 'self' https://*.r2.dev https://*.r2.cloudflarestorage.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDevelopment ? [] : ['upgrade-insecure-requests']),
].join('; ')

const nextConfig: NextConfig = {
  // Permanent redirect from the deleted self-service recovery page to the
  // canonical email-based forgot-password flow. Keeps any bookmarked links
  // from 404ing after the auth surface cleanup.
  async redirects() {
    return [
      { source: '/admin/recovery', destination: '/admin/forgot-password', permanent: true },
    ]
  },
  async headers() {
    const securityHeaders = [
      { key: 'Content-Security-Policy', value: contentSecurityPolicy },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ...(
        isDevelopment
          ? []
          : [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }]
      ),
    ]

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  images: {
    qualities: [75, 86],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'downbelowwithdrdidi.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.downbelowwithdrdidi.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'down-below-with-dr-didi.vercel.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig

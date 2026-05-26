import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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

import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FooterVisibility from '@/components/layout/FooterVisibility'
import WelcomeIntro from '@/components/layout/WelcomeIntro'
import InstallPrompt from '@/components/layout/InstallPrompt'
import ScrollToTopOnNavigation from '@/components/layout/ScrollToTopOnNavigation'
import PageLoadingLine from '@/components/layout/PageLoadingLine'
import StructuredData from '@/components/seo/StructuredData'
import { canonicalUrl, seoKeywords, siteConfig } from '@/lib/site-config'

const defaultSeoTitle = `${siteConfig.shortName} | Family, Women's and Reproductive Health in Nigeria`
const defaultSeoDescription =
  "DownBelow Family Health Initiatives with Dr. Didi provides trusted guidance on family health, women's health, reproductive health, fertility, sexuality, and community outreach in Nigeria."
const rootSeoKeywords = Array.from(
  new Set([
    ...seoKeywords,
    'family health Nigeria',
    "women's health Nigeria",
    'reproductive health Nigeria',
    'sexual health education Nigeria',
    'fertility education Nigeria',
    'community health outreach Calabar',
    'family life education Nigeria',
    'Christian family health ministry Nigeria',
    'Dr Didi family health',
  ]),
)

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  applicationName: siteConfig.name,
  title: {
    default: defaultSeoTitle,
    template: `%s | ${siteConfig.name}`,
  },
  description: defaultSeoDescription,
  manifest: '/manifest.webmanifest',
  keywords: rootSeoKeywords,
  authors: [{ name: siteConfig.founderName }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: 'Health',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: canonicalUrl('/'),
    languages: {
      'en-NG': '/',
    },
  },
  verification: {
    google:
      process.env.GOOGLE_SITE_VERIFICATION ||
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
      undefined,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: defaultSeoTitle,
    description: defaultSeoDescription,
    url: canonicalUrl('/'),
    type: 'website',
    locale: 'en_NG',
    siteName: siteConfig.name,
    images: [
      {
        url: '/logo.jpg',
        width: 1200,
        height: 1200,
        alt: `${siteConfig.name} logo`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultSeoTitle,
    description: defaultSeoDescription,
    images: ['/logo.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <body className="font-body">
        <StructuredData />
        <PageLoadingLine />
        <Suspense fallback={null}>
          <ScrollToTopOnNavigation />
        </Suspense>
        <WelcomeIntro />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 focus:px-4 focus:py-2 focus:rounded focus:font-semibold"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main-content">{children}</main>
        <InstallPrompt />
        <FooterVisibility>
          <Footer />
        </FooterVisibility>
      </body>
    </html>
  )
}

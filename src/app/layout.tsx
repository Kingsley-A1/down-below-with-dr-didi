import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WelcomeIntro from '@/components/layout/WelcomeIntro'
import StructuredData from '@/components/seo/StructuredData'
import { canonicalUrl, seoKeywords, siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  applicationName: siteConfig.name,
  title: {
    default: `${siteConfig.name} | Family, Sexuality, and Health`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: seoKeywords,
  authors: [{ name: siteConfig.founderName }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: 'Health',
  alternates: {
    languages: {
      'en-NG': '/',
    },
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
    title: `${siteConfig.name} | Family, Sexuality, and Health`,
    description: siteConfig.description,
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
    title: `${siteConfig.name} | Family, Sexuality, and Health`,
    description: siteConfig.description,
    images: ['/logo.jpg'],
  },
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body">
        <StructuredData />
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
        <Footer />
      </body>
    </html>
  )
}

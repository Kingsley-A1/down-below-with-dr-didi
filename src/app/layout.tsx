import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WelcomeIntro from '@/components/layout/WelcomeIntro'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: `${siteConfig.name} | ${siteConfig.motto}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "women's health",
    'reproductive health',
    'sexual health Nigeria',
    'infertility support',
    'faith-based health',
    'Dr. Didi',
    'SRH',
    'Calabar',
    'Down Below Family Health Initiative',
  ],
  openGraph: {
    title: `${siteConfig.name} | ${siteConfig.motto}`,
    description: siteConfig.description,
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
    title: `${siteConfig.name} | ${siteConfig.motto}`,
    description: siteConfig.description,
    images: ['/logo.jpg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body">
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

import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WelcomeIntro from '@/components/layout/WelcomeIntro'

export const metadata: Metadata = {
  metadataBase: new URL('https://down-below-with-dr-didi.vercel.app'),
  title: {
    default: 'Down Below With Dr. Didi — Teach, Heal, Win',
    template: '%s | Down Below With Dr. Didi',
  },
  description:
    "A faith-based family health initiative led by Dr. Edidiong Ekereuke, blending clinical care, natural wellness, and spiritual support for women.",
  keywords: [
    "women's health",
    'reproductive health',
    'sexual health Nigeria',
    'infertility support',
    'faith-based health',
    'Dr. Didi',
    'SRH',
    'Calabar',
  ],
  openGraph: {
    title: 'Down Below With Dr. Didi — Teach, Heal, Win',
    description:
      "A faith-based family health initiative led by Dr. Edidiong Ekereuke, blending clinical care, natural wellness, and spiritual support for women.",
    type: 'website',
    locale: 'en_NG',
    siteName: 'Down Below With Dr. Didi',
    images: [
      {
        url: '/logo.jpg',
        width: 1200,
        height: 1200,
        alt: 'Down Below With Dr. Didi logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Down Below With Dr. Didi — Teach, Heal, Win',
    description:
      "A faith-based family health initiative led by Dr. Edidiong Ekereuke, blending clinical care, natural wellness, and spiritual support for women.",
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
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded focus:font-semibold"
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

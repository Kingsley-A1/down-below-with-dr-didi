import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
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
    type: 'website',
    locale: 'en_NG',
    siteName: 'Down Below With Dr. Didi',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body">
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

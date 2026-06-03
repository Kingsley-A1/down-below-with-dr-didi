import Link from 'next/link'
import Image from 'next/image'
import { Mail, MapPin, Phone } from 'lucide-react'
import { getPublicSiteSettings } from '@/lib/site-settings'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Zm10.25 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M13.5 22v-8.1h2.7l.4-3h-3.1V9c0-.9.3-1.5 1.6-1.5h1.7V4.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.4v1.8H8v3h2.1V22h3.4Z" />
    </svg>
  )
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M21.6 7.2a2.9 2.9 0 0 0-2-2.1C17.8 4.6 12 4.6 12 4.6s-5.8 0-7.6.5a2.9 2.9 0 0 0-2 2.1A30 30 0 0 0 2 12a30 30 0 0 0 .4 4.8 2.9 2.9 0 0 0 2 2.1c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.9 2.9 0 0 0 2-2.1A30 30 0 0 0 22 12a30 30 0 0 0-.4-4.8ZM10 15.4V8.6L15.5 12 10 15.4Z" />
    </svg>
  )
}

function TiktokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M14.3 3c.2 1.7 1.2 3 2.8 3.9 1 .6 2 .8 3 .8V11a9 9 0 0 1-3.9-.9v5.6a5.7 5.7 0 1 1-4.9-5.6v3.1a2.7 2.7 0 1 0 1.9 2.6V3h3.1Z" />
    </svg>
  )
}

export default async function Footer() {
  const siteSettings = await getPublicSiteSettings()

  const socialLinks = [
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/',
      Icon: InstagramIcon,
    },
    {
      label: 'Facebook',
      href: 'https://www.facebook.com/search/top?q=Down%20Below%20with%20Dr.%20Didi',
      Icon: FacebookIcon,
    },
    {
      label: 'YouTube',
      href: 'https://www.youtube.com/results?search_query=Down+Below+with+Dr.+Didi',
      Icon: YouTubeIcon,
    },
    {
      label: 'TikTok',
      href: 'https://www.tiktok.com/',
      Icon: TiktokIcon,
    },
  ]

  return (
    <footer style={{ backgroundColor: 'var(--color-primary)', color: 'rgba(255,255,255,0.96)' }}>
      <div className="max-w-container mx-auto px-6 py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div className="space-y-5">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/logo.jpg"
                alt={siteSettings.siteName}
                width={52}
                height={52}
                className="rounded-full object-cover"
              />
              <div>
                <div className="font-heading font-bold text-lg">DownBelow Family</div>
                <div className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>with Dr. Didi</div>
              </div>
            </Link>
            <p className="max-w-md font-body text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.86)' }}>
              {siteSettings.footerBlurb}
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              {socialLinks.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 transition-colors hover:bg-white/20"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-heading text-lg font-semibold">Quick Links</h3>
            <ul className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-1">
              {[
                { href: '/', label: 'Home' },
                { href: '/about', label: 'About DownBelow' },
                { href: '/events', label: 'Events' },
                { href: '/library', label: 'Health Library' },
                { href: '/podcast', label: 'Podcast' },
                { href: '/outreach', label: 'Community Outreach' },
                { href: '/vault', label: 'The V-Vault' },
                { href: '/contact', label: 'Contact & Booking' },
                { href: '/gallery', label: 'Gallery' },
                { href: '/team', label: 'Our Team' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-body text-sm transition-colors hover:text-white"
                    style={{ color: 'rgba(255,255,255,0.9)' }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-heading text-lg font-semibold">Get in Touch</h3>
            <div className="space-y-3 font-body text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>
              <p className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0" />
                <span>Calabar, Cross River State, Nigeria</span>
              </p>
              <p className="flex items-start gap-2">
                <Mail size={15} className="mt-0.5 shrink-0" />
                <span>{siteSettings.contactEmail}</span>
              </p>
              <p className="flex items-start gap-2">
                <Phone size={15} className="mt-0.5 shrink-0" />
                <span>{siteSettings.primaryWhatsapp}</span>
              </p>
            </div>
            <Link
              href="/contact"
              className="mt-6 inline-block rounded-full px-6 py-3 font-body text-sm font-semibold transition-colors"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
            >
              Book a Consultation
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t px-6 py-5" style={{ borderColor: 'rgba(255,255,255,0.14)' }}>
        <div className="max-w-container mx-auto flex flex-col items-center justify-between gap-3 text-center font-body text-xs sm:flex-row sm:text-left" style={{ color: 'rgba(255,255,255,0.72)' }}>
          <p>© 2026 {siteSettings.siteName}. All rights reserved.</p>
          <p>Content on this site is for educational purposes only and does not substitute professional medical advice.</p>
          <div className="flex items-center gap-3">
            <Link href="/privacy" className="font-semibold underline-offset-4 hover:underline" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Privacy
            </Link>
            <Link href="/terms" className="font-semibold underline-offset-4 hover:underline" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Terms
            </Link>
          </div>
          <p>
            Designed &amp; Developed by{' '}
            <a
              href="https://bespoketech.com.ng"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold"
              style={{ color: 'var(--color-accent)' }}
            >
              Bespoke Tech
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

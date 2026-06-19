import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, Mail, MapPin } from 'lucide-react'
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 2a9.8 9.8 0 0 0-8.4 14.8L2 22l5.4-1.4A10 10 0 1 0 12 2Zm0 17.9a8 8 0 0 1-4.1-1.1l-.3-.2-3.2.8.9-3.1-.2-.3A8 8 0 1 1 12 19.9Zm4.4-5.9c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.5.1l-.7.9c-.1.1-.3.2-.5.1a6.6 6.6 0 0 1-1.9-1.2 7.3 7.3 0 0 1-1.4-1.8c-.1-.2 0-.3.1-.5l.4-.4.3-.4c.1-.1.1-.3 0-.4l-.7-1.7c-.1-.2-.3-.2-.5-.2h-.4c-.1 0-.4 0-.6.2-.2.2-.8.8-.8 1.9 0 1.1.8 2.2.9 2.3.1.2 1.6 2.6 4 3.6 2.4 1 2.4.7 2.9.7.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  )
}

function readableWhatsappLabel(whatsappUrl: string) {
  const matchedDigits = whatsappUrl.replace(/[^\d+]/g, '')
  return matchedDigits || 'Open WhatsApp'
}

export default async function Footer() {
  const siteSettings = await getPublicSiteSettings()
  const currentYear = new Date().getFullYear()

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

  const quickLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About DownBelow' },
    { href: '/events', label: 'Events' },
    { href: '/library', label: 'Health Library' },
    { href: '/podcast', label: 'Podcast' },
    { href: '/outreach', label: 'Community Outreach' },
    { href: '/vault', label: 'The V-Vault' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/team', label: 'Our Team' },
    { href: '/contact', label: 'Contact & Booking' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Use' },
  ]

  return (
    <footer
      className="relative overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, rgba(7,67,56,1) 0%, rgba(7,58,49,1) 54%, rgba(5,45,38,1) 100%)',
        color: 'rgba(255,255,255,0.96)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.18]" aria-hidden="true">
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,230,120,0.95), transparent)' }}
        />
        <div
          className="absolute -top-28 right-0 h-64 w-64 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.22), transparent 68%)' }}
        />
        <div
          className="absolute -bottom-20 left-0 h-56 w-56 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(201,255,231,0.18), transparent 70%)' }}
        />
      </div>

      <div className="max-w-container relative mx-auto px-6 py-14 sm:py-16">
        <div className="grid grid-cols-1 gap-10 border-b border-white/12 pb-10 lg:grid-cols-[1.2fr_0.9fr_1fr] lg:gap-12">
          <div className="space-y-6">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/logo.jpg"
                alt={siteSettings.siteName}
                width={56}
                height={56}
                className="rounded-full border border-white/15 object-cover shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
              />
              <div className="min-w-0">
                <div className="font-heading text-lg font-bold text-white">DownBelow Family</div>
                <div className="font-body text-sm text-white/72">with Dr. Didi</div>
              </div>
            </Link>

            <p className="max-w-xl font-body text-sm leading-7 text-white/82">
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
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/18 bg-white/8 text-white/88 transition-colors hover:bg-white/16 hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-heading text-lg font-semibold text-white">Explore</h3>
            <ul className="grid grid-cols-1 gap-y-2.5 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-1">
              {quickLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-body text-sm text-white/82 transition-colors hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="mb-4 font-heading text-lg font-semibold text-white">Get in Touch</h3>
              <div className="space-y-4 font-body text-sm text-white/84">
                <p className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
                  <span>Calabar, Cross River State, Nigeria</span>
                </p>
                <a
                  href={`mailto:${siteSettings.contactEmail}`}
                  className="flex items-start gap-3 transition-colors hover:text-white"
                >
                  <Mail size={16} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
                  <span>{siteSettings.contactEmail}</span>
                </a>
                <a
                  href={siteSettings.primaryWhatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 transition-colors hover:text-white"
                >
                  <WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#7dffbe]" />
                  <span>{readableWhatsappLabel(siteSettings.primaryWhatsapp)}</span>
                </a>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full px-5 py-3 font-body text-sm font-semibold transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
              >
                Book a Consultation
              </Link>
              <a
                href={siteSettings.primaryWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/8 px-5 py-3 font-body text-sm font-semibold text-white transition-colors hover:bg-white/14"
              >
                <WhatsAppIcon className="h-4 w-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 pt-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-body text-xs leading-6 text-white/62">
              © {currentYear} {siteSettings.siteName}. Content on this site is for educational purposes only and does not substitute professional medical advice.
            </p>
          </div>

          <a
            href="https://bespoketech.com.ng"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex max-w-fit items-center gap-3 rounded-full border border-white/14 bg-white/[0.06] px-3.5 py-2.5 text-white/78 transition-colors hover:bg-white/[0.1] hover:text-white"
            aria-label="Designed and developed by Bespoke Technologies"
          >
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
              <Image
                src="/partener/bespoke-technologies.png"
                alt="Bespoke Technologies"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            </span>
            <span className="min-w-0">
              <span className="block font-body text-[10px] font-semibold uppercase tracking-[0.22em] text-white/48">
                Design Partner
              </span>
              <span className="block font-heading text-sm font-semibold text-white">
                Bespoke Technologies
              </span>
            </span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-white/54 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white/82" />
          </a>
        </div>
      </div>
    </footer>
  )
}

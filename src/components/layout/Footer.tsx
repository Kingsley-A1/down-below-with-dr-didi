import Link from 'next/link'
import Image from 'next/image'
import { Camera, MessageCircle, Globe, Play } from 'lucide-react'

export default function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
      <div className="max-w-container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

          {/* Column 1: Brand */}
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4">
              <Image
                src="/logo.jpg"
                alt="Down Below With Dr. Didi"
                width={52}
                height={52}
                className="rounded-full object-cover"
              />
              <div>
                <div className="font-heading font-bold text-lg">Down Below</div>
                <div className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>With Dr. Didi</div>
              </div>
            </Link>
            <p className="font-body text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.65)' }}>
              A faith-based family health initiative supporting women through medical guidance, natural wellness, and spiritual encouragement.
            </p>
            <div className="flex gap-4">
              {[
                { icon: Camera, label: 'Instagram', href: 'https://www.instagram.com/' },
                { icon: MessageCircle, label: 'Twitter', href: 'https://x.com/' },
                { icon: Globe, label: 'Facebook', href: 'https://www.facebook.com/search/top?q=Down%20Below%20with%20Dr.%20Didi' },
                { icon: Play, label: 'YouTube', href: 'https://www.youtube.com/results?search_query=Down+Below+with+Dr.+Didi' },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="transition-colors"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-5">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { href: '/', label: 'Home' },
                { href: '/about', label: 'About Dr. Didi' },
                { href: '/library', label: 'Health Library' },
                { href: '/outreach', label: 'Community Outreach' },
                { href: '/vault', label: 'The V-Vault' },
                { href: '/contact', label: 'Contact & Booking' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-body text-sm transition-colors"
                    style={{ color: 'rgba(255,255,255,0.65)' }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-5">Get in Touch</h3>
            <div className="space-y-3 font-body text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
              <p>📍 Calabar, Cross River State, Nigeria</p>
              <p>📧 hello@downbelowwithdrdidi.com</p>
              <p>📱 @downbelowwithdrdidi</p>
            </div>
            <Link
              href="/contact"
              className="mt-6 inline-block font-body font-semibold text-sm px-6 py-3 rounded-full transition-colors"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
            >
              Book a Consultation
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t px-6 py-5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-container mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 font-body text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
          <p>© 2024 Down Below With Dr. Didi. All rights reserved.</p>
          <p className="text-center">Content on this site is for educational purposes only and does not substitute professional medical advice.</p>
          <p>
            Designed &amp; Developed by{' '}
            <a
              href="https://kingtech.com.ng"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-accent)' }}
            >
              King Tech Foundation
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

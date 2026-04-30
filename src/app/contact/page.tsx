import type { Metadata } from 'next'
import { Camera, MessageCircle, Globe, Play } from 'lucide-react'
import ContactForm from '@/components/contact/ContactForm'

export const metadata: Metadata = {
  title: 'Contact & Booking',
  description: 'Book a consultation with Dr. Didi or get in touch with the Down Below team.',
}

const socials = [
  { icon: Camera, label: 'Instagram', handle: '@downbelowwithdrdidi', href: 'https://www.instagram.com/' },
  { icon: MessageCircle, label: 'Twitter / X', handle: '@DrDidiHealth', href: 'https://x.com/' },
  { icon: Globe, label: 'Facebook Community', handle: 'Down Below With Dr. Didi', href: 'https://www.facebook.com/search/top?q=Down%20Below%20with%20Dr.%20Didi' },
  { icon: Play, label: 'YouTube Channel', handle: 'Down Below With Dr. Didi', href: 'https://www.youtube.com/results?search_query=Down+Below+with+Dr.+Didi' },
]

export default function ContactPage() {
  return (
    <>
      <section className="pt-32 pb-16 text-white text-center" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-container mx-auto px-6">
          <div
            className="inline-block text-sm font-body px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
          >
            Get in Touch
          </div>
          <h1 className="font-heading font-bold text-white mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)' }}>
            Contact &amp; Booking
          </h1>
          <p className="font-body text-lg max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Ready to talk? Book a consultation with Dr. Didi or reach out with any enquiries.
          </p>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[38%_62%] gap-10">
            {/* Left: Info + Socials */}
            <div className="space-y-6">
              {/* Contact info card */}
              <div className="text-white rounded-2xl p-8" style={{ backgroundColor: 'var(--color-primary)' }}>
                <h2 className="font-heading font-bold text-2xl mb-6">How to Reach Us</h2>
                <div className="space-y-4 font-body text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {[
                    { emoji: '📍', label: 'Location', value: 'Calabar, Cross River State, Nigeria' },
                    { emoji: '📧', label: 'Email', value: 'hello@downbelowwithdrdidi.com' },
                    { emoji: '🕐', label: 'Consultation Hours', value: 'Monday – Saturday · 9:00 AM – 5:00 PM WAT' },
                    { emoji: '⏱️', label: 'Response Time', value: 'Booking confirmations within 24 hours' },
                  ].map(({ emoji, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <span style={{ color: 'var(--color-accent)' }}>{emoji}</span>
                      <div>
                        <p className="font-semibold text-white">{label}</p>
                        <p>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social links */}
              <div
                className="bg-white rounded-2xl p-6 border"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <h3 className="font-heading font-bold text-xl mb-4" style={{ color: 'var(--color-primary)' }}>
                  Follow Dr. Didi
                </h3>
                <div className="space-y-3">
                  {socials.map(({ icon: Icon, label, handle, href }) => (
                    <a
                      key={label}
                      href={href}
                      className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-gray-50 group"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-colors group-hover:bg-primary"
                        style={{ backgroundColor: 'var(--color-primary-muted)' }}
                      >
                        <Icon size={17} style={{ color: 'var(--color-primary)' }} className="group-hover:!text-white transition-colors" />
                      </div>
                      <div>
                        <p className="font-body font-semibold text-sm text-gray-800">{label}</p>
                        <p className="font-body text-xs text-gray-400">{handle}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  )
}

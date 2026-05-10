import type { Metadata } from 'next'
import { getPublicSiteSettings } from '@/lib/site-settings'
import { canonicalUrl } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'The V-Vault — Ask Anonymously',
  description:
    'WhatsApp-first support for private reproductive and sexual health guidance from the Down Below with Dr. Didi team.',
  alternates: {
    canonical: canonicalUrl('/vault'),
  },
}

export const dynamic = 'force-dynamic'

export default async function VaultPage() {
  const siteSettings = await getPublicSiteSettings()

  return (
    <>
      <section className="pt-32 pb-16 text-white text-center" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-container mx-auto px-6">
          <div
            className="inline-block text-sm font-body px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
          >
            100% Anonymous
          </div>
          <h1
            className="font-heading font-bold text-white mb-4"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)' }}
          >
            The <span style={{ color: 'var(--color-accent)' }}>V-Vault</span>
          </h1>
          <p className="font-body text-base max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Ask privately and get thoughtful guidance.
          </p>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-2xl mx-auto px-6">
          <div className="mb-8 rounded-2xl border bg-white p-6" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="font-heading text-2xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
              WhatsApp First Support
            </h2>
            <p className="font-body text-sm text-gray-600 mb-4">
              For quick and personal guidance, start on WhatsApp. You can also send an email if that is easier.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={siteSettings.primaryWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full px-6 py-3 font-body font-semibold"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
              >
                Contact on WhatsApp
              </a>
              <a
                href={`mailto:${siteSettings.contactEmail}`}
                className="inline-flex items-center justify-center rounded-full px-6 py-3 font-body font-semibold border"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}
              >
                Send Gmail
              </a>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="font-heading text-xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
              Anonymous submission is currently paused
            </h3>
            <p className="font-body text-sm text-gray-600 leading-relaxed">
              The API-based anonymous message form is temporarily hidden. Please use WhatsApp first for guidance and follow-up.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

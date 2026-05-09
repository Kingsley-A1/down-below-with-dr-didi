import type { Metadata } from 'next'
import VaultForm from '@/components/vault/VaultForm'
import { getPublicSiteSettings } from '@/lib/site-settings'

export const metadata: Metadata = {
  title: 'The V-Vault — Ask Anonymously',
  description:
    'Ask Dr. Didi any reproductive or sexual health question — completely anonymously. No name, no email, no judgment.',
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
              Need direct follow-up?
            </h2>
            <p className="font-body text-sm text-gray-600 mb-4">
              Anonymous questions are reviewed by Dr. Didi through moderation. For urgent guidance, use the direct contact channels below.
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
          <VaultForm />
        </div>
      </section>
    </>
  )
}

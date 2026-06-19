import type { Metadata } from 'next'
import Link from 'next/link'
import VaultForm from '@/components/vault/VaultForm'
import { getSession } from '@/lib/auth/session'
import { getPublicSiteSettings } from '@/lib/site-settings'
import { canonicalUrl } from '@/lib/site-config'
import { isVaultSubmissionsEnabled } from '@/lib/env'
import { publicHeroGradient } from '@/lib/public-hero'

export const metadata: Metadata = {
  title: 'The V-Vault — Ask Anonymously',
  description:
    'Authenticated anonymous support for private reproductive and sexual health guidance from the Down Below with Dr. Didi team.',
  alternates: {
    canonical: canonicalUrl('/vault'),
  },
}

export const dynamic = 'force-dynamic'

export default async function VaultPage() {
  const siteSettings = await getPublicSiteSettings()
  const session = await getSession()
  const vaultEnabled = isVaultSubmissionsEnabled()

  return (
    <>
      <section className="pt-28 pb-10 text-center text-white sm:pt-32 sm:pb-14" style={{ background: publicHeroGradient('vault') }}>
        <div
          className="mx-auto"
          style={{ width: 'min(calc(100vw - 2.5rem), 56rem)' }}
        >
          <div
            className="mb-5 inline-flex rounded-full px-4 py-1.5 font-body text-sm"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
          >
            100% Anonymous
          </div>
          <h1
            className="mb-4 break-words font-heading text-4xl font-bold leading-tight text-white sm:text-5xl"
          >
            The <span style={{ color: 'var(--color-accent)' }}>V-Vault</span>
          </h1>
          <p className="mx-auto max-w-lg font-body text-base leading-7" style={{ color: 'rgba(255,255,255,0.72)' }}>
            Ask privately and get thoughtful guidance.
          </p>
        </div>
      </section>

      <section className="py-8 sm:py-12" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div
          className="mx-auto"
          style={{ width: 'min(calc(100vw - 2.5rem), 64rem)' }}
        >
          {!vaultEnabled ? (
            <div className="rounded-lg border bg-white p-5 sm:p-6" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-heading text-xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
                Anonymous submission is currently paused
              </h3>
              <p className="font-body text-sm text-gray-600 leading-relaxed">
                The V-Vault submission channel is temporarily unavailable. Please use the support channels above.
              </p>
            </div>
          ) : session ? (
            <VaultForm />
          ) : (
            <div className="rounded-lg border bg-white p-5 sm:p-6" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-heading text-xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
                Sign in to use anonymous V-Vault submissions
              </h3>
              <p className="font-body text-sm text-gray-600 leading-relaxed mb-5">
                To receive private in-browser responses, your submission is linked to your account internally while remaining anonymous to the public.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/login"
                  className="inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 font-body font-semibold"
                  style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 font-body font-semibold border"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}
                >
                  Create account
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-lg border bg-white p-5 sm:p-6" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="font-heading text-xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
              Need Immediate Support?
            </h2>
            <p className="font-body text-sm text-gray-600 mb-4">
              Use WhatsApp or email for direct support with Dr. Didi when you prefer a direct channel over anonymous submission.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={siteSettings.primaryWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 font-body font-semibold"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
              >
                Contact on WhatsApp
              </a>
              <a
                href={`mailto:${siteSettings.contactEmail}`}
                className="inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 font-body font-semibold border"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}
              >
                Send Gmail
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

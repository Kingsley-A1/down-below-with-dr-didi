import type { Metadata } from 'next'
import Link from 'next/link'
import { canonicalUrl, siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${siteConfig.shortName} handles personal information and private submissions.`,
  alternates: {
    canonical: canonicalUrl('/privacy'),
  },
}

export default function PrivacyPage() {
  return (
    <main className="section-pad" style={{ backgroundColor: 'var(--color-surface)' }}>
      <article className="mx-auto max-w-3xl rounded-2xl border bg-white p-6 sm:p-8" style={{ borderColor: 'var(--color-border)' }}>
        <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Privacy</p>
        <h1 className="mt-2 font-heading text-4xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="mt-3 font-body text-sm text-slate-600">Last updated: May 15, 2026</p>

        <div className="mt-8 space-y-6 font-body text-sm leading-7 text-slate-700">
          <section>
            <h2 className="font-heading text-xl font-bold text-slate-900">Information We Collect</h2>
            <p className="mt-2">
              We collect information you provide when creating an account, submitting forms, posting event comments, sending V-Vault questions, or contacting the team. This may include your name, email, phone number, and message content.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-slate-900">How We Use Information</h2>
            <p className="mt-2">
              We use information to provide account access, respond to questions, moderate community features, deliver private replies, manage events and content, improve operations, and protect users from misuse.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-slate-900">V-Vault and Sensitive Topics</h2>
            <p className="mt-2">
              Sensitive submissions are handled with care and limited to authorized team workflows. Avoid submitting emergency medical information through the website; seek urgent professional care when needed.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-slate-900">Cookies and Security</h2>
            <p className="mt-2">
              We use secure session cookies for authentication and administrative access. We apply role-based access controls and audit records for important administrative actions.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-slate-900">Contact</h2>
            <p className="mt-2">
              Privacy questions can be sent to{' '}
              <a href={`mailto:${siteConfig.contactEmail}`} className="font-semibold text-slate-900 underline underline-offset-4">
                {siteConfig.contactEmail}
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-5">
          <Link href="/terms" className="font-body text-sm font-semibold text-slate-900 underline underline-offset-4">
            Read the Terms of Use
          </Link>
        </div>
      </article>
    </main>
  )
}

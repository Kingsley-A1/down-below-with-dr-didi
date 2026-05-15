import type { Metadata } from 'next'
import Link from 'next/link'
import { canonicalUrl, siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: `Terms for using ${siteConfig.shortName}.`,
  alternates: {
    canonical: canonicalUrl('/terms'),
  },
}

export default function TermsPage() {
  return (
    <main className="section-pad" style={{ backgroundColor: 'var(--color-surface)' }}>
      <article className="mx-auto max-w-3xl rounded-2xl border bg-white p-6 sm:p-8" style={{ borderColor: 'var(--color-border)' }}>
        <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Legal</p>
        <h1 className="mt-2 font-heading text-4xl font-bold text-slate-900">Terms of Use</h1>
        <p className="mt-3 font-body text-sm text-slate-600">Last updated: May 15, 2026</p>

        <div className="mt-8 space-y-6 font-body text-sm leading-7 text-slate-700">
          <section>
            <h2 className="font-heading text-xl font-bold text-slate-900">Educational Purpose</h2>
            <p className="mt-2">
              {siteConfig.shortName} provides health education, community updates, outreach information, and faith-informed support. Content on this site is not a substitute for diagnosis, emergency care, or a direct consultation with a qualified medical professional.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-slate-900">Your Use of the Platform</h2>
            <p className="mt-2">
              Use the platform respectfully and lawfully. Do not submit harmful, abusive, misleading, or unlawful content. We may moderate, restrict, or remove content where needed to protect the community and the integrity of the service.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-slate-900">Accounts and Submissions</h2>
            <p className="mt-2">
              You are responsible for keeping your account details secure. Questions, comments, and submissions may be reviewed by the team for support, moderation, safety, and service improvement.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-slate-900">Media and Events</h2>
            <p className="mt-2">
              Event streams, podcast episodes, gallery images, and educational materials are provided for personal learning and community engagement. Do not reuse or redistribute platform media without permission.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-slate-900">Contact</h2>
            <p className="mt-2">
              Questions about these terms can be sent to{' '}
              <a href={`mailto:${siteConfig.contactEmail}`} className="font-semibold text-slate-900 underline underline-offset-4">
                {siteConfig.contactEmail}
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-5">
          <Link href="/privacy" className="font-body text-sm font-semibold text-slate-900 underline underline-offset-4">
            Read the Privacy Policy
          </Link>
        </div>
      </article>
    </main>
  )
}

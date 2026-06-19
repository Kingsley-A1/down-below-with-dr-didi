import Link from 'next/link'
import AdminContentContainer from '@/components/admin/AdminContentContainer'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { requireAdminPageSession } from '@/lib/admin/page-guard'
import { getPublicPlatformPage, PUBLIC_PLATFORM_PAGES } from '@/lib/public-pages'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ path?: string }>
}

export default async function AdminPreviewPage({ searchParams }: Props) {
  await requireAdminPageSession({ nextPath: '/admin/preview' })
  const { path } = await searchParams
  const activePage = getPublicPlatformPage(path)

  return (
    <AdminContentContainer>
      <AdminPageHeader
        eyebrow="Preview"
        title="Public Platform Preview"
        description="Choose a public page to inspect in a new tab. Home is the default preview target."
      />

      <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Default target</p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-slate-900">{activePage.label}</h2>
            <p className="mt-1 max-w-xl font-body text-sm text-slate-600">{activePage.description}</p>
          </div>
          <a
            href={activePage.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center justify-center rounded-full bg-slate-900 px-5 py-3 font-body text-sm font-semibold text-white"
          >
            Open {activePage.label}
          </a>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PUBLIC_PLATFORM_PAGES.map((page) => (
          <Link
            key={page.href}
            href={`/admin/preview?path=${encodeURIComponent(page.href)}`}
            className="rounded-2xl border bg-white p-5 transition-colors hover:bg-slate-50"
            style={{ borderColor: page.href === activePage.href ? 'var(--color-primary)' : 'var(--color-border)' }}
          >
            <p className="font-heading text-lg font-bold text-slate-900">
              {page.label}{page.href === '/' ? ' (default)' : ''}
            </p>
            <p className="mt-2 font-body text-sm leading-relaxed text-slate-600">{page.description}</p>
          </Link>
        ))}
      </section>
    </AdminContentContainer>
  )
}

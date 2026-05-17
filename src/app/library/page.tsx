import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Clock, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import MedicalDisclaimer from '@/components/content/MedicalDisclaimer'
import { canonicalUrl } from '@/lib/site-config'
import { getPublishedLibraryArticles } from '@/lib/library/repository'

export const metadata: Metadata = {
  title: 'Health Library',
  description: "Browse evidence-based articles on women's reproductive and sexual health — written in plain language by Dr. Didi.",
  alternates: {
    canonical: canonicalUrl('/library'),
  },
}

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ q?: string; category?: string }>
}

const baseCategories = [
  { slug: 'all', label: 'All Topics' },
  { slug: 'menstrual', label: 'Menstrual Hygiene' },
  { slug: 'sexual-wellness', label: 'Sexual Wellness' },
  { slug: 'preventative', label: 'Preventative Care' },
  { slug: 'anatomy', label: 'General Anatomy' },
  { slug: 'fertility', label: 'Fertility' },
  { slug: 'family-health', label: 'Family Health' },
]

const categoryColors: Record<string, { bg: string; text: string }> = {
  menstrual: { bg: '#fce7f3', text: '#be185d' },
  'sexual-wellness': { bg: '#ede9fe', text: '#7c3aed' },
  preventative: { bg: '#dcfce7', text: '#166534' },
  anatomy: { bg: '#dbeafe', text: '#1e40af' },
  fertility: { bg: '#ffedd5', text: '#9a3412' },
  'family-health': { bg: '#e0f2fe', text: '#075985' },
}

const categoryLabels: Record<string, string> = {
  menstrual: 'Menstrual Health',
  'sexual-wellness': 'Sexual Wellness',
  preventative: 'Preventative Care',
  anatomy: 'Anatomy',
  fertility: 'Fertility',
  'family-health': 'Family Health',
}

function topicLabel(topic: string) {
  return categoryLabels[topic] ?? topic
}

export default async function LibraryPage({ searchParams }: Props) {
  const { q = '', category: rawCategory = 'all' } = await searchParams
  const articles = await getPublishedLibraryArticles()
  const customCategories = Array.from(new Set(articles.map((article) => article.category)))
    .filter((category) => !baseCategories.some((baseCategory) => baseCategory.slug === category))
    .map((category) => ({ slug: category, label: topicLabel(category) }))
  const categories = [...baseCategories, ...customCategories]
  const activeCategory = categories.some((category) => category.slug === rawCategory) ? rawCategory : 'all'
  const query = q.trim()
  const sortedArticles = [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
  const filteredArticles = sortedArticles.filter((article) => {
    const matchesCategory = activeCategory === 'all' || article.category === activeCategory
    const haystack = [article.title, article.excerpt, article.category, ...article.tags].join(' ').toLowerCase()
    const matchesQuery = query.length === 0 || haystack.includes(query.toLowerCase())

    return matchesCategory && matchesQuery
  })

  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-container mx-auto px-6">
          <div className="text-center mb-10">
            <div
              className="inline-block text-sm font-body px-4 py-1.5 rounded-full mb-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
            >
              Knowledge is Power
            </div>
            <h1 className="font-heading font-bold text-white mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)' }}>
              Health Library
            </h1>
            <p className="font-body text-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Honest, evidence-based information about your body — no jargon, no judgment.
            </p>
          </div>
          {/* Search */}
          <form action="/library" className="max-w-xl mx-auto relative flex gap-2">
            <input type="hidden" name="category" value={activeCategory} />
            <label htmlFor="library-search" className="sr-only">
              Search health library
            </label>
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="library-search"
              name="q"
              type="search"
              placeholder="Search topics, conditions, questions…"
              defaultValue={query}
              className="min-w-0 flex-1 pl-11 pr-4 py-4 rounded-full bg-white font-body text-sm focus:outline-none shadow-lg"
              style={{ color: '#374151' }}
            />
            <button
              type="submit"
              className="shrink-0 rounded-full px-5 py-3 font-body text-sm font-semibold"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Category filter bar */}
      <div className="bg-white border-b sticky top-16 z-30" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-container mx-auto px-6 py-4">
          <div className="scroll-fade-x no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={{
                  pathname: '/library',
                  query: {
                    ...(cat.slug !== 'all' && { category: cat.slug }),
                    ...(query && { q: query }),
                  },
                }}
                className="flex-shrink-0 px-5 py-2 rounded-full text-sm font-body font-semibold transition-colors border"
                style={
                  activeCategory === cat.slug
                    ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)', borderColor: 'var(--color-accent)' }
                    : { backgroundColor: 'var(--color-surface)', color: '#4b5563', borderColor: 'var(--color-border)' }
                }
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Article grid */}
      <section className="py-16" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-container mx-auto px-6">
          {(query || activeCategory !== 'all') && (
            <div className="mb-8 flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <p className="font-body text-sm text-gray-600">
                Showing {filteredArticles.length} result{filteredArticles.length === 1 ? '' : 's'}
                {query ? ` for "${query}"` : ''}
                {activeCategory !== 'all' ? ` in ${categories.find((cat) => cat.slug === activeCategory)?.label}` : ''}.
              </p>
              <Link href="/library" className="font-body text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                Clear filters
              </Link>
            </div>
          )}

          {filteredArticles.length === 0 ? (
            <div className="rounded-2xl border bg-white px-6 py-14 text-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="font-heading text-2xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
                No matching resources
              </h2>
              <p className="font-body text-sm text-gray-600 mb-6">
                Try a broader topic or clear your filters to browse the full health library.
              </p>
              <Link href="/library" className="inline-flex rounded-full px-6 py-3 font-body text-sm font-semibold" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
                View all resources
              </Link>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => {
              const col = categoryColors[article.category] || { bg: '#f3f4f6', text: '#374151' }
              return (
                <Link key={article.slug} href={`/library/${article.slug}`} className="group">
                  <article
                    className="bg-white rounded-2xl overflow-hidden border h-full flex flex-col transition-all duration-300 hover:-translate-y-1"
                    style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
                  >
                    <div className="relative overflow-hidden" style={{ height: '210px' }}>
                      <Image
                        src={article.coverImage}
                        alt={article.title}
                        width={400}
                        height={210}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="text-xs font-body font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: col.bg, color: col.text }}
                        >
                          {topicLabel(article.category)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400 font-body">
                          <Clock size={12} /> {article.readTime} min
                        </span>
                      </div>
                      <h2
                        className="font-heading font-semibold text-xl mb-2 transition-colors"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        {article.title}
                      </h2>
                      <p className="font-body text-gray-600 text-sm leading-relaxed flex-1 line-clamp-2">
                        {article.excerpt}
                      </p>
                      <div
                        className="flex items-center justify-between mt-4 pt-4 border-t"
                        style={{ borderColor: 'var(--color-border)' }}
                      >
                        <span className="font-body text-xs text-gray-400">
                          Dr. Didi &middot; {formatDate(article.publishedAt)}
                        </span>
                        <ArrowRight
                          size={15}
                          style={{ color: 'var(--color-primary)' }}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </div>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
          )}
        </div>
      </section>

      {/* Medical disclaimer */}
      <MedicalDisclaimer />
    </>
  )
}

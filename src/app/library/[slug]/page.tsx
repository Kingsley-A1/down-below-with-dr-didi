import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import MedicalDisclaimer from '@/components/content/MedicalDisclaimer'
import { getLibraryArticleBySlug, getPublishedLibraryArticles } from '@/lib/library/repository'
import { canonicalUrl } from '@/lib/site-config'
import { formatDate } from '@/lib/utils'

interface Props {
  params: Promise<{ slug: string }>
}

const categoryLabels: Record<string, string> = {
  menstrual: 'Menstrual Health',
  'sexual-wellness': 'Sexual Wellness',
  preventative: 'Preventative Care',
  anatomy: 'Anatomy',
  fertility: 'Fertility',
  'family-health': 'Family Health',
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  menstrual: { bg: '#fce7f3', text: '#be185d' },
  'sexual-wellness': { bg: '#ede9fe', text: '#7c3aed' },
  preventative: { bg: '#dcfce7', text: '#166534' },
  anatomy: { bg: '#dbeafe', text: '#1e40af' },
  fertility: { bg: '#ffedd5', text: '#9a3412' },
  'family-health': { bg: '#e0f2fe', text: '#075985' },
}

export const dynamic = 'force-dynamic'

function topicLabel(topic: string) {
  return categoryLabels[topic] ?? topic
}

export async function generateStaticParams() {
  const articles = await getPublishedLibraryArticles()
  return articles.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getLibraryArticleBySlug(slug)

  if (!article) {
    return { title: 'Article Not Found' }
  }

  return {
    title: article.title,
    description: article.excerpt,
    alternates: {
      canonical: canonicalUrl(`/library/${article.slug}`),
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: canonicalUrl(`/library/${article.slug}`),
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author],
      images: [{ url: article.coverImage, alt: article.title }],
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = await getLibraryArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  const articles = await getPublishedLibraryArticles()
  const content = article.contentBlocks.length > 0 ? article.contentBlocks : [article.excerpt]
  const related = articles.filter((item) => item.category === article.category && item.slug !== slug).slice(0, 3)
  const col = categoryColors[article.category] || { bg: '#f3f4f6', text: '#374151' }

  return (
    <>
      <div className="pt-32 pb-12" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-container mx-auto px-6">
          <Link
            href="/library"
            className="mb-6 inline-flex items-center gap-2 font-body text-sm transition-colors"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            <ArrowLeft size={16} /> Back to Library
          </Link>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span
              className="rounded-full px-2.5 py-1 font-body text-xs font-semibold"
              style={{ backgroundColor: col.bg, color: col.text }}
            >
              {topicLabel(article.category)}
            </span>
            <span className="flex items-center gap-1 font-body text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <Clock size={12} /> {article.readTime} min read
            </span>
            <span className="flex items-center gap-1 font-body text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <Calendar size={12} /> {formatDate(article.publishedAt)}
            </span>
          </div>
          <h1
            className="mb-4 font-heading font-bold text-white"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            {article.title}
          </h1>
          <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
            By {article.author} · DownBelow Health Library
          </p>
          <p className="mt-2 font-body text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Last reviewed {formatDate(article.publishedAt)}
          </p>
        </div>
      </div>

      <div className="max-w-container mx-auto px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 overflow-hidden rounded-2xl shadow-lg">
            <Image
              src={article.coverImage}
              alt={article.title}
              width={960}
              height={440}
              className="w-full object-cover"
              style={{ aspectRatio: '12 / 5', maxHeight: '360px' }}
              priority
            />
          </div>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            {content.map((paragraph) => (
              <p key={paragraph} className="mb-5 font-body text-base leading-relaxed text-gray-700 last:mb-0">
                {paragraph}
              </p>
            ))}
          </article>

          <div className="mt-10">
            <MedicalDisclaimer compact />
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="border-t py-16" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="max-w-container mx-auto px-6">
            <h2 className="mb-8 font-heading text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
              Related Articles
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {related.map((rel) => (
                <Link key={rel.slug} href={`/library/${rel.slug}`} className="group">
                  <div
                    className="overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-1"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <div className="relative h-40 overflow-hidden">
                      <Image
                        src={rel.coverImage}
                        alt={rel.title}
                        width={300}
                        height={160}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <h3
                        className="font-heading text-lg font-semibold transition-colors"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        {rel.title}
                      </h3>
                      <p className="mt-1 font-body text-xs text-gray-400">{rel.readTime} min read</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}

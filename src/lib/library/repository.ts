import { Prisma } from '@prisma/client'
import { articles as staticArticles } from '@/data/articles'
import { hasDatabaseConfig } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import { readPublicDatabase } from '@/lib/public-database'
import { writeAuditLog } from '@/lib/admin/repository'
import type { AdminRole } from '@/lib/admin/rbac'

export type LibraryArticleStatus = 'draft' | 'published' | 'archived'

export type PublicLibraryArticle = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  contentBlocks: string[]
  category: string
  coverImage: string
  author: string
  publishedAt: string
  readTime: number
  tags: string[]
}

export type LibraryArticleRecord = PublicLibraryArticle & {
  status: LibraryArticleStatus
  createdAt: string
  updatedAt: string
}

type ArticleDbRecord = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  coverImageUrl: string | null
  readTime: number
  status: string
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const DEFAULT_COVER_IMAGE = '/assets/IMG-20260508-WA0032.jpg'
const DEFAULT_AUTHOR = 'Dr. Didi'

const articleSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  content: true,
  category: true,
  coverImageUrl: true,
  readTime: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ArticleSelect

function splitContentBlocks(content: string) {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
}

function estimateReadTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 220))
}

function tagsFromArticle(input: { title: string; category: string }) {
  const titleTags = input.title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3)
    .slice(0, 4)

  return Array.from(new Set([input.category, ...titleTags]))
}

function isKnownPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError
}

function toLibraryErrorPayload(error: unknown): { name: string; message: string; code?: string } {
  if (isKnownPrismaError(error)) {
    return { name: error.name, message: error.message, code: error.code }
  }

  if (error instanceof Error) {
    return { name: error.name, message: error.message }
  }

  return { name: 'UnknownError', message: String(error) }
}

function logPublicLibraryFallback(context: string, error: unknown): void {
  if (process.env.NODE_ENV === 'test') {
    return
  }

  console.warn('[library.public.fallback]', {
    context,
    timestamp: new Date().toISOString(),
    ...toLibraryErrorPayload(error),
  })
}

async function readPublicLibraryWithFallback<T>(
  context: string,
  fallback: T,
  query: () => Promise<T>
): Promise<T> {
  return readPublicDatabase({
    context,
    fallback,
    query,
    onError: logPublicLibraryFallback,
  })
}

function staticArticleRecords(): LibraryArticleRecord[] {
  const now = new Date().toISOString()

  return staticArticles.map((article) => {
    const content = article.content.join('\n\n')
    return {
      id: `static-${article.slug}`,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      content,
      contentBlocks: article.content,
      category: article.category,
      coverImage: article.coverImage,
      author: article.author,
      publishedAt: new Date(article.publishedAt).toISOString(),
      readTime: article.readTime,
      tags: article.tags,
      status: 'published',
      createdAt: now,
      updatedAt: now,
    }
  })
}

function mapArticle(record: ArticleDbRecord): LibraryArticleRecord {
  const contentBlocks = splitContentBlocks(record.content)

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    excerpt: record.excerpt,
    content: record.content,
    contentBlocks,
    category: record.category,
    coverImage: record.coverImageUrl || DEFAULT_COVER_IMAGE,
    author: DEFAULT_AUTHOR,
    publishedAt: (record.publishedAt || record.createdAt).toISOString(),
    readTime: record.readTime || estimateReadTime(record.content),
    tags: tagsFromArticle({ title: record.title, category: record.category }),
    status: record.status as LibraryArticleStatus,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function toPublicArticle(record: ArticleDbRecord): PublicLibraryArticle {
  const article = mapArticle(record)

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    contentBlocks: article.contentBlocks,
    category: article.category,
    coverImage: article.coverImage,
    author: article.author,
    publishedAt: article.publishedAt,
    readTime: article.readTime,
    tags: article.tags,
  }
}

async function ensureSeedArticles() {
  const count = await prisma.article.count()

  if (count > 0) {
    return
  }

  await prisma.article.createMany({
    data: staticArticles.map((article) => ({
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content.join('\n\n'),
      category: article.category,
      coverImageUrl: article.coverImage,
      readTime: article.readTime,
      status: 'published' as const,
      publishedAt: new Date(article.publishedAt),
    })),
    skipDuplicates: true,
  })
}

export async function getPublishedLibraryArticles(): Promise<PublicLibraryArticle[]> {
  return readPublicLibraryWithFallback('articles.published', staticArticleRecords(), async () => {
    await ensureSeedArticles()

    const records = await prisma.article.findMany({
      where: { status: 'published' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      select: articleSelect,
    })

    return records.map((record: ArticleDbRecord) => toPublicArticle(record))
  })
}

export async function getAllLibraryArticles(): Promise<LibraryArticleRecord[]> {
  if (!hasDatabaseConfig()) {
    return staticArticleRecords()
  }

  await ensureSeedArticles()

  const records = await prisma.article.findMany({
    orderBy: [{ updatedAt: 'desc' }],
    select: articleSelect,
  })

  return records.map((record: ArticleDbRecord) => mapArticle(record))
}

export async function getLibraryArticleBySlug(slug: string): Promise<PublicLibraryArticle | null> {
  const fallback = staticArticleRecords().find((article) => article.slug === slug && article.status === 'published') ?? null

  return readPublicLibraryWithFallback('articles.by_slug', fallback, async () => {
    await ensureSeedArticles()

    const record = await prisma.article.findFirst({
      where: { slug, status: 'published' },
      select: articleSelect,
    })

    return record ? toPublicArticle(record as ArticleDbRecord) : null
  })
}

export async function createLibraryArticle(
  input: {
    slug: string
    title: string
    excerpt: string
    content: string
    category: string
    coverImageUrl?: string
    readTime?: number
    status?: LibraryArticleStatus
    publishedAt?: string
  },
  actor: { email: string; role: AdminRole }
): Promise<LibraryArticleRecord> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const status = input.status ?? 'draft'
  const record = await prisma.article.create({
    data: {
      slug: input.slug.trim(),
      title: input.title.trim(),
      excerpt: input.excerpt.trim(),
      content: input.content.trim(),
      category: input.category,
      coverImageUrl: input.coverImageUrl?.trim() || null,
      readTime: input.readTime ?? estimateReadTime(input.content),
      status,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : status === 'published' ? new Date() : null,
    },
  })

  await writeAuditLog({
    action: 'library_article.created',
    entityType: 'article',
    entityId: record.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Created library article "${record.title}"`,
    metadata: { slug: record.slug, status: record.status },
  })

  return mapArticle(record as ArticleDbRecord)
}

export async function updateLibraryArticle(
  id: string,
  input: Partial<{
    slug: string
    title: string
    excerpt: string
    content: string
    category: string
    coverImageUrl: string | null
    readTime: number
    status: LibraryArticleStatus
    publishedAt: string | null
  }>,
  actor: { email: string; role: AdminRole }
): Promise<LibraryArticleRecord> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const existing = await prisma.article.findUnique({ where: { id } })

  if (!existing) {
    throw new Error('Library article not found')
  }

  const nextStatus = input.status ?? existing.status
  const shouldSetPublishedAt = nextStatus === 'published' && !existing.publishedAt && input.publishedAt === undefined

  const record = await prisma.article.update({
    where: { id },
    data: {
      ...(input.slug !== undefined && { slug: input.slug.trim() }),
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.excerpt !== undefined && { excerpt: input.excerpt.trim() }),
      ...(input.content !== undefined && {
        content: input.content.trim(),
        readTime: input.readTime ?? estimateReadTime(input.content),
      }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.coverImageUrl !== undefined && { coverImageUrl: input.coverImageUrl?.trim() || null }),
      ...(input.readTime !== undefined && input.content === undefined && { readTime: input.readTime }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.publishedAt !== undefined && { publishedAt: input.publishedAt ? new Date(input.publishedAt) : null }),
      ...(shouldSetPublishedAt && { publishedAt: new Date() }),
    },
  })

  await writeAuditLog({
    action: 'library_article.updated',
    entityType: 'article',
    entityId: record.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Updated library article "${record.title}"`,
    metadata: { slug: record.slug, changedFields: Object.keys(input) },
  })

  return mapArticle(record as ArticleDbRecord)
}

export async function deleteLibraryArticle(
  id: string,
  actor: { email: string; role: AdminRole }
): Promise<void> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const record = await prisma.article.delete({ where: { id } })

  await writeAuditLog({
    action: 'library_article.deleted',
    entityType: 'article',
    entityId: id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Deleted library article "${record.title}"`,
    metadata: { slug: record.slug },
  })
}

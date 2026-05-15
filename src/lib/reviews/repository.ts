import { hasDatabaseConfig } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import { reviewSeedItems } from '@/data/reviews'
import { writeAuditLog } from '@/lib/admin/repository'
import type { AdminRole } from '@/lib/admin/rbac'

export const PUBLIC_REVIEW_LIMIT = 60

export type ReviewStatus = 'draft' | 'published' | 'archived'
export type ReviewSource = 'public_submission' | 'admin_created' | 'seed'

export type PublicReviewRecord = {
  id: string
  displayName: string
  roleLabel: string | null
  location: string | null
  rating: number
  body: string
  adminReply: string | null
  adminRepliedAt: string | null
  publishedAt: string | null
  createdAt: string
  helpfulCount: number
  viewerHasMarkedHelpful: boolean
}

export type AdminReviewRecord = PublicReviewRecord & {
  status: ReviewStatus
  source: ReviewSource
  sortOrder: number
  userId: string | null
  adminReplyAuthorEmail: string | null
  updatedAt: string
}

type ReviewDbRecord = {
  id: string
  displayName: string
  roleLabel: string | null
  location: string | null
  rating: number
  body: string
  status: string
  source: string
  sortOrder: number
  userId: string | null
  adminReply: string | null
  adminReplyAuthorEmail: string | null
  adminRepliedAt: Date | null
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  _count: {
    helpfuls: number
  }
  helpfuls?: Array<{ id: string }>
}

function mapPublicReview(record: ReviewDbRecord): PublicReviewRecord {
  return {
    id: record.id,
    displayName: record.displayName,
    roleLabel: record.roleLabel,
    location: record.location,
    rating: record.rating,
    body: record.body,
    adminReply: record.adminReply,
    adminRepliedAt: record.adminRepliedAt ? record.adminRepliedAt.toISOString() : null,
    publishedAt: record.publishedAt ? record.publishedAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
    helpfulCount: record._count.helpfuls,
    viewerHasMarkedHelpful: Boolean(record.helpfuls?.length),
  }
}

function mapAdminReview(record: ReviewDbRecord): AdminReviewRecord {
  return {
    ...mapPublicReview(record),
    status: record.status as ReviewStatus,
    source: record.source as ReviewSource,
    sortOrder: record.sortOrder,
    userId: record.userId,
    adminReplyAuthorEmail: record.adminReplyAuthorEmail,
    updatedAt: record.updatedAt.toISOString(),
  }
}

function fallbackReviews(): PublicReviewRecord[] {
  return reviewSeedItems.map((item, index) => ({
    id: `seed-review-${index}`,
    displayName: item.displayName,
    roleLabel: item.roleLabel || null,
    location: item.location || null,
    rating: item.rating,
    body: item.body,
    adminReply: item.adminReply || null,
    adminRepliedAt: null,
    publishedAt: new Date(0).toISOString(),
    createdAt: new Date(0).toISOString(),
    helpfulCount: index === 0 ? 18 : 11,
    viewerHasMarkedHelpful: false,
  }))
}

export async function getPublishedReviews(viewerUserId?: string | null): Promise<PublicReviewRecord[]> {
  if (!hasDatabaseConfig()) {
    return fallbackReviews()
  }

  try {
    const records = await prisma.review.findMany({
      where: { status: 'published' },
      orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: PUBLIC_REVIEW_LIMIT,
      include: {
        _count: { select: { helpfuls: true } },
        helpfuls: viewerUserId
          ? {
              where: { userId: viewerUserId },
              select: { id: true },
              take: 1,
            }
          : false,
      },
    })

    if (records.length === 0) {
      return fallbackReviews()
    }

    return records.map((record) => mapPublicReview(record as ReviewDbRecord))
  } catch {
    return fallbackReviews()
  }
}

export async function getAllReviews(): Promise<AdminReviewRecord[]> {
  if (!hasDatabaseConfig()) {
    return fallbackReviews().map((review, index) => ({
      ...review,
      status: 'published',
      source: 'seed',
      sortOrder: index,
      userId: null,
      adminReplyAuthorEmail: null,
      updatedAt: review.createdAt,
    }))
  }

  const records = await prisma.review.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: {
      _count: { select: { helpfuls: true } },
    },
  })

  return records.map((record) => mapAdminReview(record as ReviewDbRecord))
}

export async function createPublicReview(input: {
  displayName: string
  roleLabel?: string
  location?: string
  rating?: number
  body: string
  userId?: string | null
}): Promise<PublicReviewRecord> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const record = await prisma.review.create({
    data: {
      displayName: input.displayName.trim(),
      roleLabel: input.roleLabel?.trim() || null,
      location: input.location?.trim() || null,
      rating: input.rating ?? 5,
      body: input.body.trim(),
      status: 'draft',
      source: 'public_submission',
      userId: input.userId || null,
    },
    include: { _count: { select: { helpfuls: true } } },
  })

  return mapPublicReview(record as ReviewDbRecord)
}

export async function createAdminReview(
  input: {
    displayName: string
    roleLabel?: string
    location?: string
    rating?: number
    body: string
    status?: ReviewStatus
    source?: ReviewSource
    sortOrder?: number
    adminReply?: string
    publishedAt?: string
  },
  actor: { email: string; role: AdminRole }
): Promise<AdminReviewRecord> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const isPublished = (input.status ?? 'published') === 'published'
  const record = await prisma.review.create({
    data: {
      displayName: input.displayName.trim(),
      roleLabel: input.roleLabel?.trim() || null,
      location: input.location?.trim() || null,
      rating: input.rating ?? 5,
      body: input.body.trim(),
      status: input.status ?? 'published',
      source: input.source ?? 'admin_created',
      sortOrder: input.sortOrder ?? 0,
      adminReply: input.adminReply?.trim() || null,
      adminReplyAuthorEmail: input.adminReply?.trim() ? actor.email : null,
      adminRepliedAt: input.adminReply?.trim() ? new Date() : null,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : isPublished ? new Date() : null,
    },
    include: { _count: { select: { helpfuls: true } } },
  })

  await writeAuditLog({
    action: 'review.created',
    entityType: 'review',
    entityId: record.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Created review from ${record.displayName}`,
    metadata: { status: record.status, source: record.source },
  })

  return mapAdminReview(record as ReviewDbRecord)
}

export async function updateAdminReview(
  id: string,
  input: Partial<{
    displayName: string
    roleLabel: string
    location: string
    rating: number
    body: string
    status: ReviewStatus
    source: ReviewSource
    sortOrder: number
    adminReply: string
    publishedAt: string
  }>,
  actor: { email: string; role: AdminRole }
): Promise<AdminReviewRecord> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const replyChanged = input.adminReply !== undefined
  const record = await prisma.review.update({
    where: { id },
    data: {
      ...(input.displayName !== undefined && { displayName: input.displayName.trim() }),
      ...(input.roleLabel !== undefined && { roleLabel: input.roleLabel.trim() || null }),
      ...(input.location !== undefined && { location: input.location.trim() || null }),
      ...(input.rating !== undefined && { rating: input.rating }),
      ...(input.body !== undefined && { body: input.body.trim() }),
      ...(input.status !== undefined && {
        status: input.status,
        ...(input.status === 'published' && { publishedAt: new Date() }),
      }),
      ...(input.source !== undefined && { source: input.source }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      ...(replyChanged && {
        adminReply: input.adminReply?.trim() || null,
        adminReplyAuthorEmail: input.adminReply?.trim() ? actor.email : null,
        adminRepliedAt: input.adminReply?.trim() ? new Date() : null,
      }),
      ...(input.publishedAt !== undefined && {
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
      }),
    },
    include: { _count: { select: { helpfuls: true } } },
  })

  await writeAuditLog({
    action: 'review.updated',
    entityType: 'review',
    entityId: record.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Updated review from ${record.displayName}`,
    metadata: { changedFields: Object.keys(input), status: record.status },
  })

  return mapAdminReview(record as ReviewDbRecord)
}

export async function deleteAdminReview(
  id: string,
  actor: { email: string; role: AdminRole }
): Promise<void> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const record = await prisma.review.delete({ where: { id } })

  await writeAuditLog({
    action: 'review.deleted',
    entityType: 'review',
    entityId: id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Deleted review from ${record.displayName}`,
    metadata: { status: record.status, source: record.source },
  })
}

export async function markReviewHelpful(reviewId: string, userId: string): Promise<number> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  await prisma.reviewHelpful.upsert({
    where: {
      reviewId_userId: { reviewId, userId },
    },
    update: {},
    create: { reviewId, userId },
  })

  return prisma.reviewHelpful.count({ where: { reviewId } })
}

export async function unmarkReviewHelpful(reviewId: string, userId: string): Promise<number> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  await prisma.reviewHelpful.deleteMany({ where: { reviewId, userId } })
  return prisma.reviewHelpful.count({ where: { reviewId } })
}

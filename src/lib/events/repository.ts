import { hasDatabaseConfig } from '@/lib/env'
import { prisma } from '@/lib/prisma'

export const PUBLIC_COMMENT_LIMIT = 50
export const COMMENT_RATE_LIMIT_WINDOW_MS = 60 * 1000
export const COMMENT_RATE_LIMIT_MAX = 5

export type PublicEventRecord = {
  id: string
  slug: string
  title: string
  summary: string
  body: string | null
  coverImageUrl: string | null
  coverImageAlt: string | null
  communityLabel: string | null
  location: string | null
  scheduledAt: string | null
  endedAt: string | null
  streamUrl: string | null
  streamProvider: string | null
  isLive: boolean
  engagementEnabled: boolean
  publishedAt: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  _count: {
    likes: number
    comments: number
  }
}

export type PublicCommentRecord = {
  id: string
  eventId: string
  displayName: string
  body: string
  createdAt: string
}

type EventDbRecord = {
  id: string
  slug: string
  title: string
  summary: string
  body: string | null
  coverImageUrl: string | null
  coverImageAlt: string | null
  communityLabel: string | null
  location: string | null
  scheduledAt: Date | null
  endedAt: Date | null
  streamUrl: string | null
  streamProvider: string | null
  isLive: boolean
  engagementEnabled: boolean
  publishedAt: Date | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  _count: {
    likes: number
    comments: number
  }
}

type CommentDbRecord = {
  id: string
  eventId: string
  displayName: string
  body: string
  createdAt: Date
}

function mapPublicEvent(record: EventDbRecord): PublicEventRecord {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    summary: record.summary,
    body: record.body,
    coverImageUrl: record.coverImageUrl,
    coverImageAlt: record.coverImageAlt,
    communityLabel: record.communityLabel,
    location: record.location,
    scheduledAt: record.scheduledAt ? record.scheduledAt.toISOString() : null,
    endedAt: record.endedAt ? record.endedAt.toISOString() : null,
    streamUrl: record.streamUrl,
    streamProvider: record.streamProvider,
    isLive: record.isLive,
    engagementEnabled: record.engagementEnabled,
    publishedAt: record.publishedAt ? record.publishedAt.toISOString() : null,
    sortOrder: record.sortOrder,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    _count: {
      likes: record._count.likes,
      comments: record._count.comments,
    },
  }
}

function mapPublicComment(record: CommentDbRecord): PublicCommentRecord {
  return {
    id: record.id,
    eventId: record.eventId,
    displayName: record.displayName,
    body: record.body,
    createdAt: record.createdAt.toISOString(),
  }
}

export async function getPublishedEvents(): Promise<PublicEventRecord[]> {
  if (!hasDatabaseConfig()) {
    return []
  }

  const records = await prisma.outreachEvent.findMany({
    where: { status: 'published' },
    orderBy: [
      { isLive: 'desc' },
      { sortOrder: 'asc' },
      { scheduledAt: 'asc' },
      { createdAt: 'desc' },
    ],
    include: {
      _count: {
        select: {
          likes: true,
          comments: {
            where: {
              status: 'visible',
            },
          },
        },
      },
    },
  })

  return records.map((record) => mapPublicEvent(record as EventDbRecord))
}

export async function getEventBySlug(slug: string): Promise<PublicEventRecord | null> {
  if (!hasDatabaseConfig()) {
    return null
  }

  const record = await prisma.outreachEvent.findFirst({
    where: { slug, status: 'published' },
    include: {
      _count: {
        select: {
          likes: true,
          comments: {
            where: {
              status: 'visible',
            },
          },
        },
      },
    },
  })

  if (!record) {
    return null
  }

  return mapPublicEvent(record as EventDbRecord)
}

export async function getEventLikeCount(eventId: string): Promise<number> {
  if (!hasDatabaseConfig()) {
    return 0
  }

  return prisma.eventLike.count({ where: { eventId } })
}

export async function hasUserLikedEvent(eventId: string, userId: string): Promise<boolean> {
  if (!hasDatabaseConfig()) {
    return false
  }

  const like = await prisma.eventLike.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
    select: { id: true },
  })

  return Boolean(like)
}

export async function likeEvent(eventId: string, userId: string): Promise<void> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  await prisma.eventLike.upsert({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
    update: {},
    create: {
      eventId,
      userId,
    },
  })
}

export async function unlikeEvent(eventId: string, userId: string): Promise<void> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  await prisma.eventLike.deleteMany({
    where: {
      eventId,
      userId,
    },
  })
}

export async function getVisibleComments(
  eventId: string,
  limit = PUBLIC_COMMENT_LIMIT
): Promise<PublicCommentRecord[]> {
  if (!hasDatabaseConfig()) {
    return []
  }

  const records = await prisma.eventComment.findMany({
    where: {
      eventId,
      status: 'visible',
    },
    orderBy: [{ createdAt: 'desc' }],
    take: Math.min(Math.max(limit, 1), PUBLIC_COMMENT_LIMIT),
  })

  return records.map((record) => mapPublicComment(record as CommentDbRecord))
}

export async function countRecentUserComments(eventId: string, userId: string): Promise<number> {
  if (!hasDatabaseConfig()) {
    return 0
  }

  return prisma.eventComment.count({
    where: {
      eventId,
      userId,
      createdAt: {
        gte: new Date(Date.now() - COMMENT_RATE_LIMIT_WINDOW_MS),
      },
    },
  })
}

export async function addComment(
  eventId: string,
  userId: string,
  displayName: string,
  body: string
): Promise<PublicCommentRecord> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const record = await prisma.eventComment.create({
    data: {
      eventId,
      userId,
      displayName: displayName.trim(),
      body: body.trim(),
      status: 'visible',
    },
  })

  return mapPublicComment(record as CommentDbRecord)
}

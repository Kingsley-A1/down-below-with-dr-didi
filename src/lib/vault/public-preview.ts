import { vaultPreviewItems } from '@/data/vault-preview'
import { hasDatabaseConfig } from '@/lib/env'
import { prisma } from '@/lib/prisma'

export type PublicVaultPreviewItem = {
  id: string
  question: string
  answer: string
  category: string
}

function fallbackVaultPreviewItems(limit: number): PublicVaultPreviewItem[] {
  return vaultPreviewItems.slice(0, limit).map((item) => ({
    id: `fallback-${item.id}`,
    question: item.question,
    answer: item.answer,
    category: item.category,
  }))
}

export async function getPublicVaultPreviewItems(limit = 4): Promise<PublicVaultPreviewItem[]> {
  const fallback = fallbackVaultPreviewItems(limit)

  if (!hasDatabaseConfig()) {
    return fallback
  }

  try {
    const records = await prisma.vaultSubmission.findMany({
      where: {
        status: 'approved_for_faq',
        responses: {
          some: {},
        },
      },
      select: {
        id: true,
        category: true,
        question: true,
        responses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            responseBody: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    })

    const liveItems = records
      .map((record) => ({
        id: record.id,
        question: record.question,
        answer: record.responses[0]?.responseBody || '',
        category: record.category,
      }))
      .filter((item) => item.answer.trim().length > 0)

    return [...liveItems, ...fallback].slice(0, limit)
  } catch {
    return fallback
  }
}

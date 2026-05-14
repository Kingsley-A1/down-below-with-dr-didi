import { z } from 'zod'

export const publicationStatusSchema = z.enum(['draft', 'published', 'archived'])
export const streamProviderSchema = z.enum(['youtube', 'facebook'])
export const commentStatusSchema = z.enum(['visible', 'hidden', 'flagged'])

const eventBaseSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(140),
  summary: z.string().trim().min(10, 'Summary must be at least 10 characters').max(300),
  body: z.string().max(20000).optional().or(z.literal('')),
  coverImageUrl: z.string().trim().max(1000).optional().or(z.literal('')),
  coverImageAlt: z.string().trim().max(200).optional().or(z.literal('')),
  communityLabel: z.string().trim().max(60).optional().or(z.literal('')),
  location: z.string().trim().max(200).optional().or(z.literal('')),
  scheduledAt: z.string().datetime({ offset: true }).optional().or(z.literal('')),
  endedAt: z.string().datetime({ offset: true }).optional().or(z.literal('')),
  streamUrl: z.string().url('Enter a valid stream URL').max(2000).optional().or(z.literal('')),
  streamProvider: streamProviderSchema.optional(),
  isLive: z.boolean().optional(),
  engagementEnabled: z.boolean().optional(),
  status: publicationStatusSchema.optional(),
  publishedAt: z.string().datetime({ offset: true }).optional().or(z.literal('')),
  sortOrder: z.number().int().min(0).optional(),
})

function validateScheduleWindow(
  data: {
    scheduledAt?: string | undefined
    endedAt?: string | undefined
  },
  ctx: z.RefinementCtx
) {
  if (!data.scheduledAt || !data.endedAt) {
    return
  }

  const scheduledAt = new Date(data.scheduledAt)
  const endedAt = new Date(data.endedAt)

  if (endedAt <= scheduledAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endedAt'],
      message: 'End time must be after scheduled time',
    })
  }
}

export const createEventSchema = eventBaseSchema
  .extend({
    slug: z
      .string()
      .trim()
      .min(3, 'Slug must be at least 3 characters')
      .max(100)
      .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
  })
  .superRefine(validateScheduleWindow)

export const updateEventSchema = eventBaseSchema.partial().superRefine(validateScheduleWindow)

export const eventCommentModerationSchema = z.object({
  status: commentStatusSchema,
})

export const eventCommentSchema = z.object({
  body: z.string().trim().min(2, 'Comment must be at least 2 characters').max(2000),
})

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type EventCommentInput = z.infer<typeof eventCommentSchema>

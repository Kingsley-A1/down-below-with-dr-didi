import { z } from 'zod'

export const vaultSchema = z.object({
  category: z.enum([
    'Menstrual Health',
    'Sexual Wellness',
    'Anatomy & Body',
    'Contraception',
    'Pregnancy & Fertility',
    'Other',
  ]),
  question: z
    .string()
    .min(50, 'Please provide at least 50 characters so Dr. Didi can help you best.')
    .max(500, 'Maximum 500 characters.'),
})

export const contactSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    // Nigerian mobile numbers: (+234 or 0) + network prefix (7xx/8xx/9xx, second digit 0 or 1) + 8 digits
    .regex(/^(\+234|0)[789][01]\d{8}$/, 'Please enter a valid Nigerian phone number')
    .optional()
    .or(z.literal('')),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
})

export const adminSignInSchema = z.object({
  email: z.string().email('Enter a valid admin email address'),
  accessCode: z.string().min(12, 'Admin access code must be at least 12 characters'),
})

export const vaultModerationSchema = z.object({
  id: z.string().min(1, 'Submission id is required'),
  status: z.enum(['new', 'reviewed', 'answered_privately', 'approved_for_faq', 'archived']),
  moderationNotes: z.string().max(600).optional().or(z.literal('')),
  approvedFaqTitle: z.string().max(180).optional().or(z.literal('')),
})

export const siteSettingsSchema = z.object({
  siteName: z.string().min(5).max(120),
  tagline: z.string().min(10).max(180),
  motto: z.string().min(8).max(120),
  siteUrl: z.string().url('Enter a valid site URL'),
  primaryWhatsapp: z.string().url('Enter a valid WhatsApp link'),
  contactEmail: z.string().email('Enter a valid contact email'),
  heroHeadline: z.string().min(10).max(140),
  heroBody: z.string().min(20).max(400),
  heroImageUrl: z.string().url('Enter a valid image URL').optional().or(z.literal('')),
  heroImageAlt: z.string().max(160).optional().or(z.literal('')),
  footerBlurb: z.string().min(20).max(280),
})

export type VaultFormData = z.infer<typeof vaultSchema>
export type ContactFormData = z.infer<typeof contactSchema>
export type AdminSignInData = z.infer<typeof adminSignInSchema>
export type SiteSettingsFormData = z.infer<typeof siteSettingsSchema>
export type VaultModerationData = z.infer<typeof vaultModerationSchema>

// ─────────────────────────────────────────────
// TEAM MEMBER VALIDATION
// ─────────────────────────────────────────────

export const teamMemberSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.string().min(2, 'Role must be at least 2 characters').max(100),
  tier: z.enum(['founder', 'leadership', 'core']),
  sortOrder: z.number().int().min(0).optional().default(0),
  credentials: z.string().min(2).max(200),
  bio: z
    .string()
    .min(40, 'Bio must be at least 40 characters')
    .max(600, 'Bio may not exceed 600 characters'),
  imageUrl: z.string().url('Enter a valid image URL').optional().or(z.literal('')),
  imageAlt: z.string().max(160).optional().or(z.literal('')),
  status: z.enum(['draft', 'published', 'archived']).optional().default('published'),
})

export const teamMemberUpdateSchema = teamMemberSchema.partial().extend({
  id: z.string().min(1, 'Team member id is required'),
})

export type TeamMemberFormData = z.infer<typeof teamMemberSchema>
export type TeamMemberUpdateData = z.infer<typeof teamMemberUpdateSchema>

// ─────────────────────────────────────────────
// GALLERY IMAGE VALIDATION
// ─────────────────────────────────────────────

export const galleryImageSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(160),
  description: z
    .string()
    .min(40, 'Description must be at least 40 characters')
    .max(800, 'Description may not exceed 800 characters'),
  caption: z.string().max(200).optional().or(z.literal('')),
  imageUrl: z.string().min(1, 'Image URL is required').max(500),
  imageAlt: z.string().min(5, 'Alt text must be at least 5 characters').max(200),
  category: z.enum(['outreach', 'event', 'team', 'community', 'facility']),
  eventName: z.string().max(160).optional().or(z.literal('')),
  location: z.string().max(160).optional().or(z.literal('')),
  capturedAt: z.string().datetime({ offset: true }).optional().or(z.literal('')),
  sortOrder: z.number().int().min(0).optional().default(0),
  status: z.enum(['draft', 'published', 'archived']).optional().default('published'),
})

export const galleryImageUpdateSchema = galleryImageSchema.partial().extend({
  id: z.string().min(1, 'Gallery image id is required'),
})

export type GalleryImageFormData = z.infer<typeof galleryImageSchema>
export type GalleryImageUpdateData = z.infer<typeof galleryImageUpdateSchema>

// ─────────────────────────────────────────────
// PODCAST EPISODE VALIDATION
// ─────────────────────────────────────────────

export const podcastEpisodeSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(160),
  summary: z
    .string()
    .min(20, 'Summary must be at least 20 characters')
    .max(280, 'Summary may not exceed 280 characters'),
  description: z
    .string()
    .min(40, 'Show notes must be at least 40 characters')
    .max(5000, 'Show notes may not exceed 5000 characters'),
  audioUrl: z.string().min(1, 'Audio URL is required').max(1000),
  audioSize: z.number().int().min(0).optional(),
  audioType: z.string().max(120).optional().or(z.literal('')),
  duration: z.number().int().min(1).max(86400).optional(),
  coverImage: z.string().max(1000).optional().or(z.literal('')),
  guestName: z.string().max(120).optional().or(z.literal('')),
  topicTags: z.array(z.string().min(1).max(40)).max(12).optional().default([]),
  transcript: z.string().max(20000).optional().or(z.literal('')),
  externalSourceUrl: z.string().url('Enter a valid external URL').optional().or(z.literal('')),
  publishedAt: z.string().datetime({ offset: true }).optional().or(z.literal('')),
  sortOrder: z.number().int().min(0).optional().default(0),
  status: z.enum(['draft', 'published', 'archived']).optional().default('published'),
})

export const podcastEpisodeUpdateSchema = podcastEpisodeSchema.partial().extend({
  id: z.string().min(1, 'Podcast episode id is required'),
})

export type PodcastEpisodeFormData = z.infer<typeof podcastEpisodeSchema>
export type PodcastEpisodeUpdateData = z.infer<typeof podcastEpisodeUpdateSchema>

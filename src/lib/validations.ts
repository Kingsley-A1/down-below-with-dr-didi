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

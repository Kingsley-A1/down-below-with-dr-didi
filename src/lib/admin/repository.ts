import { prisma } from '@/lib/prisma'
import { hasDatabaseConfig } from '@/lib/env'
import { defaultSiteSettings, type SiteSettingsState } from '@/lib/site-config'
import type { AdminRole } from '@/lib/admin/rbac'

export type DashboardSummary = {
  adminUsers: number
  mediaAssets: number
  auditLogs: number
  vaultSubmissions: number
  databaseReady: boolean
}

export type MediaAssetRecord = {
  id: string
  label: string
  url: string
  mimeType: string
  sizeBytes: number
  kind: 'image' | 'document' | 'video' | 'other'
  altText: string | null
  createdAt: string
}

type MediaAssetDbRecord = {
  id: string
  label: string
  url: string
  mimeType: string
  sizeBytes: number
  kind: MediaAssetRecord['kind']
  altText: string | null
  createdAt: Date
}

export type VaultSubmissionRecord = {
  id: string
  category: string
  question: string
  status: 'new' | 'reviewed' | 'answered_privately' | 'approved_for_faq' | 'archived'
  moderationNotes: string | null
  approvedFaqTitle: string | null
  createdAt: string
  updatedAt: string
}

export async function upsertAdminUserRecord(email: string, role: AdminRole) {
  if (!hasDatabaseConfig()) {
    return null
  }

  return prisma.adminUser.upsert({
    where: { email: email.trim().toLowerCase() },
    update: { role, isActive: true },
    create: { email: email.trim().toLowerCase(), role },
  })
}

export async function writeAuditLog(entry: {
  action: string
  entityType: string
  entityId?: string | null
  actorEmail: string
  actorRole: AdminRole
  summary: string
  metadata?: Record<string, unknown>
}) {
  if (!hasDatabaseConfig()) {
    return null
  }

  const actor = await prisma.adminUser.findUnique({
    where: { email: entry.actorEmail.trim().toLowerCase() },
  })

  return prisma.auditLog.create({
    data: {
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId || null,
      actorEmail: entry.actorEmail.trim().toLowerCase(),
      actorRole: entry.actorRole,
      summary: entry.summary,
      metadata: entry.metadata ? JSON.parse(JSON.stringify(entry.metadata)) : undefined,
      actorId: actor?.id,
    },
  })
}

export async function getSiteSettings(): Promise<SiteSettingsState> {
  if (!hasDatabaseConfig()) {
    return defaultSiteSettings
  }

  const record = await prisma.siteSettings.upsert({
    where: { scope: 'global' },
    update: {},
    create: {
      scope: 'global',
      ...defaultSiteSettings,
      heroImageUrl: null,
      heroImageAlt: null,
    },
  })

  return {
    siteName: record.siteName,
    tagline: record.tagline,
    motto: record.motto,
    siteUrl: record.siteUrl,
    primaryWhatsapp: record.primaryWhatsapp,
    contactEmail: record.contactEmail,
    heroHeadline: record.heroHeadline,
    heroBody: record.heroBody,
    heroImageUrl: record.heroImageUrl || '',
    heroImageAlt: record.heroImageAlt || '',
    footerBlurb: record.footerBlurb,
  }
}

export async function saveSiteSettings(input: SiteSettingsState, actor: { email: string; role: AdminRole }) {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const adminUser = await upsertAdminUserRecord(actor.email, actor.role)

  const record = await prisma.siteSettings.upsert({
    where: { scope: 'global' },
    update: {
      siteName: input.siteName,
      tagline: input.tagline,
      motto: input.motto,
      siteUrl: input.siteUrl,
      primaryWhatsapp: input.primaryWhatsapp,
      contactEmail: input.contactEmail,
      heroHeadline: input.heroHeadline,
      heroBody: input.heroBody,
      heroImageUrl: input.heroImageUrl || null,
      heroImageAlt: input.heroImageAlt || null,
      footerBlurb: input.footerBlurb,
      updatedById: adminUser?.id,
    },
    create: {
      scope: 'global',
      siteName: input.siteName,
      tagline: input.tagline,
      motto: input.motto,
      siteUrl: input.siteUrl,
      primaryWhatsapp: input.primaryWhatsapp,
      contactEmail: input.contactEmail,
      heroHeadline: input.heroHeadline,
      heroBody: input.heroBody,
      heroImageUrl: input.heroImageUrl || null,
      heroImageAlt: input.heroImageAlt || null,
      footerBlurb: input.footerBlurb,
      updatedById: adminUser?.id,
    },
  })

  await writeAuditLog({
    action: 'site_settings.updated',
    entityType: 'site_settings',
    entityId: record.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: 'Updated global site settings',
    metadata: {
      heroHeadline: input.heroHeadline,
      primaryWhatsapp: input.primaryWhatsapp,
    },
  })

  return record
}

export async function listMediaAssets(): Promise<MediaAssetRecord[]> {
  if (!hasDatabaseConfig()) {
    return []
  }

  const records = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return records.map((record: MediaAssetDbRecord) => ({
    id: record.id,
    label: record.label,
    url: record.url,
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes,
    kind: record.kind,
    altText: record.altText,
    createdAt: record.createdAt.toISOString(),
  }))
}

export async function createMediaAssetRecord(input: {
  label: string
  storageKey: string
  bucket: string
  url: string
  mimeType: string
  sizeBytes: number
  kind: 'image' | 'document' | 'video' | 'other'
  altText?: string
  actorEmail: string
  actorRole: AdminRole
}) {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const adminUser = await upsertAdminUserRecord(input.actorEmail, input.actorRole)

  const record = await prisma.mediaAsset.create({
    data: {
      label: input.label,
      storageKey: input.storageKey,
      bucket: input.bucket,
      url: input.url,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      kind: input.kind,
      altText: input.altText || null,
      createdById: adminUser?.id,
    },
  })

  await writeAuditLog({
    action: 'media_asset.created',
    entityType: 'media_asset',
    entityId: record.id,
    actorEmail: input.actorEmail,
    actorRole: input.actorRole,
    summary: `Uploaded media asset ${input.label}`,
    metadata: {
      storageKey: input.storageKey,
      bucket: input.bucket,
      mimeType: input.mimeType,
    },
  })

  return record
}

export async function createVaultSubmission(input: { category: string; question: string }) {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  return prisma.vaultSubmission.create({
    data: {
      category: input.category,
      question: input.question,
    },
  })
}

export async function listVaultSubmissions(): Promise<VaultSubmissionRecord[]> {
  if (!hasDatabaseConfig()) {
    return []
  }

  const records = await prisma.vaultSubmission.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return records.map((record) => ({
    id: record.id,
    category: record.category,
    question: record.question,
    status: record.status,
    moderationNotes: record.moderationNotes,
    approvedFaqTitle: record.approvedFaqTitle,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }))
}

export async function updateVaultSubmissionModeration(
  input: {
    id: string
    status: 'new' | 'reviewed' | 'answered_privately' | 'approved_for_faq' | 'archived'
    moderationNotes?: string
    approvedFaqTitle?: string
  },
  actor: { email: string; role: AdminRole }
) {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const record = await prisma.vaultSubmission.update({
    where: { id: input.id },
    data: {
      status: input.status,
      moderationNotes: input.moderationNotes?.trim() ? input.moderationNotes.trim() : null,
      approvedFaqTitle: input.approvedFaqTitle?.trim() ? input.approvedFaqTitle.trim() : null,
    },
  })

  await writeAuditLog({
    action: 'vault_submission.moderated',
    entityType: 'vault_submission',
    entityId: record.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Updated vault submission status to ${input.status}`,
    metadata: {
      status: input.status,
      approvedFaqTitle: record.approvedFaqTitle,
    },
  })

  return record
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (!hasDatabaseConfig()) {
    return {
      adminUsers: 0,
      mediaAssets: 0,
      auditLogs: 0,
      vaultSubmissions: 0,
      databaseReady: false,
    }
  }

  const [adminUsers, mediaAssets, auditLogs, vaultSubmissions] = await Promise.all([
    prisma.adminUser.count(),
    prisma.mediaAsset.count(),
    prisma.auditLog.count(),
    prisma.vaultSubmission.count(),
  ])

  return {
    adminUsers,
    mediaAssets,
    auditLogs,
    vaultSubmissions,
    databaseReady: true,
  }
}

export async function createContactSubmission(input: {
  firstName: string
  lastName: string
  email: string
  phone?: string
  preferredDate?: string
  preferredTime?: string
  message: string
}) {
  if (!hasDatabaseConfig()) {
    // Graceful degradation: no DB configured (e.g. local dev without .env).
    return null
  }

  return prisma.contactSubmission.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      preferredDate: input.preferredDate?.trim() || null,
      preferredTime: input.preferredTime?.trim() || null,
      message: input.message,
    },
  })
}

// ─────────────────────────────────────────────
// TEAM MEMBERS
// ─────────────────────────────────────────────

export type TeamTier = 'founder' | 'leadership' | 'core'

export type PublicTeamMember = {
  id: string
  slug: string
  name: string
  role: string
  tier: TeamTier
  sortOrder: number
  credentials: string
  bio: string
  imageUrl: string | null
  imageAlt: string | null
}

export type TeamMemberRecord = PublicTeamMember & {
  status: 'draft' | 'published' | 'archived'
  createdAt: string
  updatedAt: string
}

function mapTeamMember(r: {
  id: string
  slug: string
  name: string
  role: string
  tier: string
  sortOrder: number
  credentials: string
  bio: string
  imageUrl: string | null
  imageAlt: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}): TeamMemberRecord {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    role: r.role,
    tier: r.tier as TeamTier,
    sortOrder: r.sortOrder,
    credentials: r.credentials,
    bio: r.bio,
    imageUrl: r.imageUrl,
    imageAlt: r.imageAlt,
    status: r.status as TeamMemberRecord['status'],
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

export async function getPublishedTeamMembers(): Promise<PublicTeamMember[]> {
  if (!hasDatabaseConfig()) {
    return []
  }

  const records = await prisma.teamMember.findMany({
    where: { status: 'published' },
    orderBy: [{ sortOrder: 'asc' }],
  })

  return records.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    role: r.role,
    tier: r.tier as TeamTier,
    sortOrder: r.sortOrder,
    credentials: r.credentials,
    bio: r.bio,
    imageUrl: r.imageUrl,
    imageAlt: r.imageAlt,
  }))
}

export async function getAllTeamMembers(): Promise<TeamMemberRecord[]> {
  if (!hasDatabaseConfig()) {
    return []
  }

  const records = await prisma.teamMember.findMany({
    orderBy: [{ sortOrder: 'asc' }],
  })

  return records.map(mapTeamMember)
}

export async function createTeamMember(
  input: {
    slug: string
    name: string
    role: string
    tier: TeamTier
    sortOrder?: number
    credentials: string
    bio: string
    imageUrl?: string
    imageAlt?: string
    status?: 'draft' | 'published'
  },
  actor: { email: string; role: AdminRole }
): Promise<TeamMemberRecord> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const record = await prisma.teamMember.create({
    data: {
      slug: input.slug.trim(),
      name: input.name.trim(),
      role: input.role.trim(),
      tier: input.tier,
      sortOrder: input.sortOrder ?? 0,
      credentials: input.credentials.trim(),
      bio: input.bio.trim(),
      imageUrl: input.imageUrl?.trim() || null,
      imageAlt: input.imageAlt?.trim() || null,
      status: input.status ?? 'published',
    },
  })

  await writeAuditLog({
    action: 'team_member.created',
    entityType: 'team_member',
    entityId: record.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Created team member ${record.name}`,
    metadata: { slug: record.slug, tier: record.tier },
  })

  return mapTeamMember(record)
}

export async function updateTeamMember(
  id: string,
  input: Partial<{
    slug: string
    name: string
    role: string
    tier: TeamTier
    sortOrder: number
    credentials: string
    bio: string
    imageUrl: string | null
    imageAlt: string | null
    status: 'draft' | 'published' | 'archived'
  }>,
  actor: { email: string; role: AdminRole }
): Promise<TeamMemberRecord> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const record = await prisma.teamMember.update({
    where: { id },
    data: {
      ...(input.slug !== undefined && { slug: input.slug.trim() }),
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.role !== undefined && { role: input.role.trim() }),
      ...(input.tier !== undefined && { tier: input.tier }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      ...(input.credentials !== undefined && { credentials: input.credentials.trim() }),
      ...(input.bio !== undefined && { bio: input.bio.trim() }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl?.trim() || null }),
      ...(input.imageAlt !== undefined && { imageAlt: input.imageAlt?.trim() || null }),
      ...(input.status !== undefined && { status: input.status }),
    },
  })

  await writeAuditLog({
    action: 'team_member.updated',
    entityType: 'team_member',
    entityId: record.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Updated team member ${record.name}`,
    metadata: { slug: record.slug, changedFields: Object.keys(input) },
  })

  return mapTeamMember(record)
}

export async function deleteTeamMember(
  id: string,
  actor: { email: string; role: AdminRole }
): Promise<void> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const record = await prisma.teamMember.delete({ where: { id } })

  await writeAuditLog({
    action: 'team_member.deleted',
    entityType: 'team_member',
    entityId: id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Deleted team member ${record.name}`,
    metadata: { slug: record.slug },
  })
}

// ─────────────────────────────────────────────
// GALLERY IMAGES
// ─────────────────────────────────────────────

export type GalleryImageCategory = 'outreach' | 'event' | 'team' | 'community' | 'facility'

export type PublicGalleryImage = {
  id: string
  slug: string
  title: string
  description: string
  caption: string | null
  imageUrl: string
  imageAlt: string
  category: GalleryImageCategory
  eventName: string | null
  location: string | null
  capturedAt: string | null
  sortOrder: number
}

export type GalleryImageRecord = PublicGalleryImage & {
  status: 'draft' | 'published' | 'archived'
  createdAt: string
  updatedAt: string
}

function mapGalleryImage(r: {
  id: string
  slug: string
  title: string
  description: string
  caption: string | null
  imageUrl: string
  imageAlt: string
  category: string
  eventName: string | null
  location: string | null
  capturedAt: Date | null
  sortOrder: number
  status: string
  createdAt: Date
  updatedAt: Date
}): GalleryImageRecord {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    caption: r.caption,
    imageUrl: r.imageUrl,
    imageAlt: r.imageAlt,
    category: r.category as GalleryImageCategory,
    eventName: r.eventName,
    location: r.location,
    capturedAt: r.capturedAt ? r.capturedAt.toISOString() : null,
    sortOrder: r.sortOrder,
    status: r.status as GalleryImageRecord['status'],
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

export async function getPublishedGalleryImages(
  category?: GalleryImageCategory
): Promise<PublicGalleryImage[]> {
  if (!hasDatabaseConfig()) {
    return []
  }

  const records = await prisma.galleryImage.findMany({
    where: {
      status: 'published',
      ...(category ? { category } : {}),
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })

  return records.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    caption: r.caption,
    imageUrl: r.imageUrl,
    imageAlt: r.imageAlt,
    category: r.category as GalleryImageCategory,
    eventName: r.eventName,
    location: r.location,
    capturedAt: r.capturedAt ? r.capturedAt.toISOString() : null,
    sortOrder: r.sortOrder,
  }))
}

export async function getGalleryImageBySlug(
  slug: string
): Promise<PublicGalleryImage | null> {
  if (!hasDatabaseConfig()) {
    return null
  }

  const r = await prisma.galleryImage.findUnique({
    where: { slug, status: 'published' },
  })

  if (!r) return null

  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    caption: r.caption,
    imageUrl: r.imageUrl,
    imageAlt: r.imageAlt,
    category: r.category as GalleryImageCategory,
    eventName: r.eventName,
    location: r.location,
    capturedAt: r.capturedAt ? r.capturedAt.toISOString() : null,
    sortOrder: r.sortOrder,
  }
}

export async function getAllGalleryImages(): Promise<GalleryImageRecord[]> {
  if (!hasDatabaseConfig()) {
    return []
  }

  const records = await prisma.galleryImage.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })

  return records.map(mapGalleryImage)
}

export async function createGalleryImage(
  input: {
    slug: string
    title: string
    description: string
    caption?: string
    imageUrl: string
    imageAlt: string
    category: GalleryImageCategory
    eventName?: string
    location?: string
    capturedAt?: string
    sortOrder?: number
    status?: 'draft' | 'published'
  },
  actor: { email: string; role: AdminRole }
): Promise<GalleryImageRecord> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const record = await prisma.galleryImage.create({
    data: {
      slug: input.slug.trim(),
      title: input.title.trim(),
      description: input.description.trim(),
      caption: input.caption?.trim() || null,
      imageUrl: input.imageUrl.trim(),
      imageAlt: input.imageAlt.trim(),
      category: input.category,
      eventName: input.eventName?.trim() || null,
      location: input.location?.trim() || null,
      capturedAt: input.capturedAt ? new Date(input.capturedAt) : null,
      sortOrder: input.sortOrder ?? 0,
      status: input.status ?? 'published',
    },
  })

  await writeAuditLog({
    action: 'gallery_image.created',
    entityType: 'gallery_image',
    entityId: record.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Created gallery image "${record.title}"`,
    metadata: { slug: record.slug, category: record.category },
  })

  return mapGalleryImage(record)
}

export async function updateGalleryImage(
  id: string,
  input: Partial<{
    slug: string
    title: string
    description: string
    caption: string | null
    imageUrl: string
    imageAlt: string
    category: GalleryImageCategory
    eventName: string | null
    location: string | null
    capturedAt: string | null
    sortOrder: number
    status: 'draft' | 'published' | 'archived'
  }>,
  actor: { email: string; role: AdminRole }
): Promise<GalleryImageRecord> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const record = await prisma.galleryImage.update({
    where: { id },
    data: {
      ...(input.slug !== undefined && { slug: input.slug.trim() }),
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(input.caption !== undefined && { caption: input.caption?.trim() || null }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl.trim() }),
      ...(input.imageAlt !== undefined && { imageAlt: input.imageAlt.trim() }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.eventName !== undefined && { eventName: input.eventName?.trim() || null }),
      ...(input.location !== undefined && { location: input.location?.trim() || null }),
      ...(input.capturedAt !== undefined && {
        capturedAt: input.capturedAt ? new Date(input.capturedAt) : null,
      }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      ...(input.status !== undefined && { status: input.status }),
    },
  })

  await writeAuditLog({
    action: 'gallery_image.updated',
    entityType: 'gallery_image',
    entityId: record.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Updated gallery image "${record.title}"`,
    metadata: { slug: record.slug, changedFields: Object.keys(input) },
  })

  return mapGalleryImage(record)
}

export async function deleteGalleryImage(
  id: string,
  actor: { email: string; role: AdminRole }
): Promise<void> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const record = await prisma.galleryImage.delete({ where: { id } })

  await writeAuditLog({
    action: 'gallery_image.deleted',
    entityType: 'gallery_image',
    entityId: id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Deleted gallery image "${record.title}"`,
    metadata: { slug: record.slug, category: record.category },
  })
}
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
      metadata: entry.metadata,
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

  return records.map((record) => ({
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
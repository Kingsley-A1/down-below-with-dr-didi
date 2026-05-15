import { prisma } from '@/lib/prisma'
import { hasDatabaseConfig } from '@/lib/env'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { defaultSiteSettings, type SiteSettingsState } from '@/lib/site-config'
import { canViewVaultIdentity, type AdminRole } from '@/lib/admin/rbac'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { gallerySeedItems } from '@/data/gallery'
import { team as staticTeam } from '@/data/team'

export type DashboardSummary = {
  adminUsers: number
  platformUsers: number
  mediaAssets: number
  auditLogs: number
  vaultSubmissions: number
  contactSubmissions: number
  teamMembers: number
  galleryImages: number
  reviews: number
  podcastEpisodes: number
  outreachEvents: number
  activeAlerts: number
  databaseReady: boolean
}

export type MediaAssetRecord = {
  id: string
  label: string
  storageKey: string
  bucket: string
  url: string
  mimeType: string
  sizeBytes: number
  kind: 'image' | 'audio' | 'document' | 'video' | 'other'
  altText: string | null
  createdAt: string
}

type MediaAssetDbRecord = {
  id: string
  label: string
  storageKey: string
  bucket: string
  url: string
  mimeType: string
  sizeBytes: number
  kind: MediaAssetRecord['kind']
  altText: string | null
  createdAt: Date
}

export type MediaAssetUsageRecord = {
  entityType: 'site_settings' | 'team_member' | 'gallery_image' | 'podcast_episode'
  entityId: string
  entityLabel: string
  field: 'heroImageUrl' | 'imageUrl' | 'audioUrl' | 'coverImage'
}

export type VaultSubmissionRecord = {
  id: string
  category: string
  question: string
  status: 'new' | 'reviewed' | 'answered_privately' | 'approved_for_faq' | 'archived'
  source: 'app_authenticated' | 'whatsapp_import' | 'manual_admin'
  moderationNotes: string | null
  approvedFaqTitle: string | null
  submitter: {
    hasLinkedAccount: boolean
    displayName: string | null
    email: string | null
  }
  createdAt: string
  updatedAt: string
}

export type VaultResponseRecord = {
  id: string
  submissionId: string
  responseBody: string
  responderRole: AdminRole
  deliveredAt: string | null
  createdAt: string
  updatedAt: string
}

export type UserNotificationRecord = {
  id: string
  type: string
  title: string
  body: string
  entityType: string | null
  entityId: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export type UserVaultThreadRecord = {
  id: string
  category: string
  question: string
  status: VaultSubmissionRecord['status']
  createdAt: string
  updatedAt: string
  responses: VaultResponseRecord[]
}

export type AdminAccountRecord = {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: AdminRole
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

type VaultSubmissionDbRecord = {
  id: string
  category: string
  question: string
  status: VaultSubmissionRecord['status']
  source: VaultSubmissionRecord['source']
  moderationNotes: string | null
  approvedFaqTitle: string | null
  userId: string | null
  user: {
    id: string
    displayName: string
    email: string
  } | null
  createdAt: Date
  updatedAt: Date
}

type VaultResponseDbRecord = {
  id: string
  submissionId: string
  responseBody: string
  responderRole: AdminRole
  deliveredAt: Date | null
  createdAt: Date
  updatedAt: Date
}

type UserNotificationDbRecord = {
  id: string
  type: string
  title: string
  body: string
  entityType: string | null
  entityId: string | null
  isRead: boolean
  readAt: Date | null
  createdAt: Date
}

type AdminAccountDbRecord = {
  id: string
  email: string
  name: string | null
  phone: string | null
  passwordHash: string | null
  role: AdminRole
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

function mapVaultSubmissionRecord(
  record: VaultSubmissionDbRecord,
  options?: { includeIdentity?: boolean }
): VaultSubmissionRecord {
  const includeIdentity = options?.includeIdentity === true

  return {
    id: record.id,
    category: record.category,
    question: record.question,
    status: record.status,
    source: record.source,
    moderationNotes: record.moderationNotes,
    approvedFaqTitle: record.approvedFaqTitle,
    submitter: {
      hasLinkedAccount: record.userId !== null,
      displayName: includeIdentity ? (record.user?.displayName ?? null) : null,
      email: includeIdentity ? (record.user?.email ?? null) : null,
    },
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function mapVaultResponseRecord(record: VaultResponseDbRecord): VaultResponseRecord {
  return {
    id: record.id,
    submissionId: record.submissionId,
    responseBody: record.responseBody,
    responderRole: record.responderRole,
    deliveredAt: record.deliveredAt ? record.deliveredAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function mapUserNotificationRecord(record: UserNotificationDbRecord): UserNotificationRecord {
  return {
    id: record.id,
    type: record.type,
    title: record.title,
    body: record.body,
    entityType: record.entityType,
    entityId: record.entityId,
    isRead: record.isRead,
    readAt: record.readAt ? record.readAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
  }
}

function mapAdminAccountRecord(record: AdminAccountDbRecord): AdminAccountRecord {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    phone: record.phone,
    role: record.role,
    isActive: record.isActive,
    lastLoginAt: record.lastLoginAt ? record.lastLoginAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function normalizeAdminIdentity(input: { email: string; name?: string; phone?: string }) {
  return {
    email: input.email.trim().toLowerCase(),
    name: input.name?.trim() || null,
    phone: input.phone?.trim() || null,
  }
}

function normalizePublicImageUrl(imageUrl: string): string {
  const trimmed = imageUrl.trim()
  if (!trimmed) {
    return trimmed
  }

  if (trimmed.startsWith('/')) {
    return trimmed
  }

  try {
    const parsed = new URL(trimmed)
    const hostname = parsed.hostname.toLowerCase()
    const pathWithQuery = `${parsed.pathname}${parsed.search}${parsed.hash}`

    // Normalize known local/site-hosted URLs to relative paths so they stay portable.
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === 'down-below-with-dr-didi.vercel.app' ||
      hostname === 'downbelowwithdrdidi.com' ||
      hostname === 'www.downbelowwithdrdidi.com'
    ) {
      return pathWithQuery || '/'
    }

    // Ensure remote object storage links use https for image optimization compatibility.
    if (
      (hostname.endsWith('.r2.dev') || hostname.endsWith('.r2.cloudflarestorage.com')) &&
      parsed.protocol === 'http:'
    ) {
      parsed.protocol = 'https:'
      return parsed.toString()
    }
  } catch {
    return trimmed
  }

  return trimmed
}

function supportsAdminUserField(fieldName: string): boolean {
  const runtimeDataModel = (prisma as unknown as {
    _runtimeDataModel?: {
      models?: Record<string, { fields?: Array<{ name?: string }> }>
    }
  })._runtimeDataModel

  const fields = runtimeDataModel?.models?.AdminUser?.fields

  // If runtime metadata is unavailable, preserve current behavior.
  if (!Array.isArray(fields)) {
    return true
  }

  return fields.some((field) => field?.name === fieldName)
}

function isUnknownPrismaArgumentError(error: unknown, argumentName: string): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return error.message.includes(`Unknown argument \`${argumentName}\``)
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

export async function registerAdminUserAccount(input: {
  name: string
  email: string
  phone: string
  password: string
  role: AdminRole
}) {
  if (!hasDatabaseConfig()) {
    return null
  }

  const normalized = normalizeAdminIdentity(input)
  const existing = (await prisma.adminUser.findUnique({
    where: { email: normalized.email },
  })) as AdminAccountDbRecord | null

  if (existing?.passwordHash) {
    throw new Error('ADMIN_ACCOUNT_ALREADY_REGISTERED')
  }

  const passwordHash = await hashPassword(input.password)
  const includePhone = supportsAdminUserField('phone')

  const writeAccount = async (withPhone: boolean) => {
    return existing
      ? ((await prisma.adminUser.update({
          where: { email: normalized.email },
          data: {
            name: normalized.name,
            ...(withPhone ? { phone: normalized.phone } : {}),
            passwordHash,
            role: input.role,
            isActive: true,
          },
        })) as AdminAccountDbRecord)
      : ((await prisma.adminUser.create({
          data: {
            email: normalized.email,
            name: normalized.name,
            ...(withPhone ? { phone: normalized.phone } : {}),
            passwordHash,
            role: input.role,
            isActive: true,
          },
        })) as AdminAccountDbRecord)
  }

  let account: AdminAccountDbRecord

  try {
    account = await writeAccount(includePhone)
  } catch (error) {
    if (includePhone && isUnknownPrismaArgumentError(error, 'phone')) {
      account = await writeAccount(false)
    } else {
      throw error
    }
  }

  return mapAdminAccountRecord(account)
}

export async function authenticateAdminUser(email: string, password: string) {
  if (!hasDatabaseConfig()) {
    return null
  }

  const normalizedEmail = email.trim().toLowerCase()
  const account = (await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
  })) as AdminAccountDbRecord | null

  if (!account || !account.isActive || !account.passwordHash) {
    return null
  }

  const passwordValid = await verifyPassword(password, account.passwordHash)

  if (!passwordValid) {
    return null
  }

  const updated = (await prisma.adminUser.update({
    where: { email: normalizedEmail },
    data: { lastLoginAt: new Date() },
  })) as AdminAccountDbRecord

  return mapAdminAccountRecord(updated)
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

type SiteAlertDbRecord = {
  id: string
  text: string
  speed: number
  durationSeconds: number
  isActive: boolean
  startsAt: Date
  endsAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type SiteAlertRecord = {
  id: string
  text: string
  speed: number
  durationSeconds: number
  isActive: boolean
  isCurrentlyActive: boolean
  startsAt: string
  endsAt: string | null
  createdAt: string
  updatedAt: string
}

export type PublicSiteAlertRecord = Pick<
  SiteAlertRecord,
  'id' | 'text' | 'speed' | 'durationSeconds' | 'startsAt' | 'endsAt'
>

function isAlertActiveNow(alert: {
  isActive: boolean
  startsAt: Date
  endsAt: Date | null
}, at: Date = new Date()) {
  if (!alert.isActive) {
    return false
  }

  if (alert.startsAt > at) {
    return false
  }

  if (alert.endsAt && alert.endsAt <= at) {
    return false
  }

  return true
}

function mapSiteAlert(record: SiteAlertDbRecord): SiteAlertRecord {
  return {
    id: record.id,
    text: record.text,
    speed: record.speed,
    durationSeconds: record.durationSeconds,
    isActive: record.isActive,
    isCurrentlyActive: isAlertActiveNow(record),
    startsAt: record.startsAt.toISOString(),
    endsAt: record.endsAt ? record.endsAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function assertAlertWindow(startsAt: Date, endsAt: Date | null) {
  if (endsAt && endsAt <= startsAt) {
    throw new Error('Alert end time must be after start time')
  }
}

export async function listSiteAlerts(): Promise<SiteAlertRecord[]> {
  if (!hasDatabaseConfig()) {
    return []
  }

  const records = await prisma.siteAlert.findMany({
    orderBy: [{ startsAt: 'desc' }, { createdAt: 'desc' }],
  })

  return records.map((record: SiteAlertDbRecord) => mapSiteAlert(record))
}

export async function listPublicActiveSiteAlerts(): Promise<PublicSiteAlertRecord[]> {
  if (!hasDatabaseConfig()) {
    return []
  }

  const now = new Date()

  const records = await prisma.siteAlert.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
    orderBy: [{ startsAt: 'desc' }, { updatedAt: 'desc' }],
    take: 6,
  })

  return records.map((record: SiteAlertDbRecord) => ({
    id: record.id,
    text: record.text,
    speed: record.speed,
    durationSeconds: record.durationSeconds,
    startsAt: record.startsAt.toISOString(),
    endsAt: record.endsAt ? record.endsAt.toISOString() : null,
  }))
}

export async function createSiteAlert(
  input: {
    text: string
    speed?: number
    durationSeconds?: number
    isActive?: boolean
    startsAt?: string
    endsAt?: string
  },
  actor: { email: string; role: AdminRole }
): Promise<SiteAlertRecord> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const startsAt = input.startsAt ? new Date(input.startsAt) : new Date()
  const endsAt = input.endsAt ? new Date(input.endsAt) : null

  assertAlertWindow(startsAt, endsAt)

  const record = await prisma.siteAlert.create({
    data: {
      text: input.text.trim(),
      speed: input.speed ?? 100,
      durationSeconds: input.durationSeconds ?? 22,
      isActive: input.isActive ?? true,
      startsAt,
      endsAt,
    },
  })

  await writeAuditLog({
    action: 'site_alert.created',
    entityType: 'site_alert',
    entityId: record.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: 'Created site alert',
    metadata: {
      isActive: record.isActive,
      startsAt: record.startsAt.toISOString(),
      endsAt: record.endsAt ? record.endsAt.toISOString() : null,
    },
  })

  return mapSiteAlert(record as SiteAlertDbRecord)
}

export async function updateSiteAlert(
  id: string,
  input: {
    text?: string
    speed?: number
    durationSeconds?: number
    isActive?: boolean
    startsAt?: string
    endsAt?: string | null
  },
  actor: { email: string; role: AdminRole }
): Promise<SiteAlertRecord> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const existing = await prisma.siteAlert.findUnique({ where: { id } })

  if (!existing) {
    throw new Error('Site alert not found')
  }

  const startsAt = input.startsAt ? new Date(input.startsAt) : existing.startsAt
  const endsAt = input.endsAt === undefined ? existing.endsAt : input.endsAt ? new Date(input.endsAt) : null

  assertAlertWindow(startsAt, endsAt)

  const record = await prisma.siteAlert.update({
    where: { id },
    data: {
      ...(input.text !== undefined && { text: input.text.trim() }),
      ...(input.speed !== undefined && { speed: input.speed }),
      ...(input.durationSeconds !== undefined && { durationSeconds: input.durationSeconds }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.startsAt !== undefined && { startsAt }),
      ...(input.endsAt !== undefined && { endsAt }),
    },
  })

  await writeAuditLog({
    action: 'site_alert.updated',
    entityType: 'site_alert',
    entityId: record.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: 'Updated site alert',
    metadata: {
      isActive: record.isActive,
      startsAt: record.startsAt.toISOString(),
      endsAt: record.endsAt ? record.endsAt.toISOString() : null,
    },
  })

  return mapSiteAlert(record as SiteAlertDbRecord)
}

export async function deleteSiteAlert(id: string, actor: { email: string; role: AdminRole }) {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const record = await prisma.siteAlert.delete({ where: { id } })

  await writeAuditLog({
    action: 'site_alert.deleted',
    entityType: 'site_alert',
    entityId: record.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: 'Deleted site alert',
    metadata: {
      startsAt: record.startsAt.toISOString(),
      endsAt: record.endsAt ? record.endsAt.toISOString() : null,
    },
  })

  return true
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
    storageKey: record.storageKey,
    bucket: record.bucket,
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
  kind: 'image' | 'audio' | 'document' | 'video' | 'other'
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

export async function getMediaAssetDeletePreview(id: string): Promise<{
  asset: Pick<MediaAssetRecord, 'id' | 'label' | 'storageKey' | 'bucket' | 'url'>
  usages: MediaAssetUsageRecord[]
}> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    select: {
      id: true,
      label: true,
      storageKey: true,
      bucket: true,
      url: true,
    },
  })

  if (!asset) {
    throw new Error('Media asset not found')
  }

  const [heroRef, teamRefs, galleryRefs, podcastRefs] = await Promise.all([
    prisma.siteSettings.findFirst({
      where: { heroImageUrl: asset.url },
      select: { id: true, scope: true },
    }),
    prisma.teamMember.findMany({
      where: { imageUrl: asset.url },
      select: { id: true, name: true },
      take: 10,
    }),
    prisma.galleryImage.findMany({
      where: { imageUrl: asset.url },
      select: { id: true, title: true },
      take: 10,
    }),
    prisma.podcastEpisode.findMany({
      where: {
        OR: [{ audioUrl: asset.url }, { coverImage: asset.url }],
      },
      select: { id: true, title: true, audioUrl: true, coverImage: true },
      take: 10,
    }),
  ])

  const usages: MediaAssetUsageRecord[] = []

  if (heroRef) {
    usages.push({
      entityType: 'site_settings',
      entityId: heroRef.id,
      entityLabel: heroRef.scope,
      field: 'heroImageUrl',
    })
  }

  usages.push(
    ...teamRefs.map((member: { id: string; name: string }) => ({
      entityType: 'team_member' as const,
      entityId: member.id,
      entityLabel: member.name,
      field: 'imageUrl' as const,
    }))
  )

  usages.push(
    ...galleryRefs.map((image: { id: string; title: string }) => ({
      entityType: 'gallery_image' as const,
      entityId: image.id,
      entityLabel: image.title,
      field: 'imageUrl' as const,
    }))
  )

  usages.push(
    ...podcastRefs.map((episode: { id: string; title: string; audioUrl: string; coverImage: string | null }) => ({
      entityType: 'podcast_episode' as const,
      entityId: episode.id,
      entityLabel: episode.title,
      field: (episode.audioUrl === asset.url ? 'audioUrl' : 'coverImage') as 'audioUrl' | 'coverImage',
    }))
  )

  return { asset, usages }
}

export async function deleteMediaAssetRecord(id: string, actor: { email: string; role: AdminRole }): Promise<void> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const record = await prisma.mediaAsset.delete({ where: { id } })

  await writeAuditLog({
    action: 'media_asset.deleted',
    entityType: 'media_asset',
    entityId: id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Deleted media asset ${record.label}`,
    metadata: {
      storageKey: record.storageKey,
      bucket: record.bucket,
      url: record.url,
    },
  })
}

async function createVaultSubmissionEvent(input: {
  submissionId: string
  actorType: 'user' | 'admin' | 'system'
  actorUserId?: string | null
  actorAdminEmail?: string | null
  eventType: string
  metadata?: Record<string, unknown>
}) {
  if (!hasDatabaseConfig()) {
    return null
  }

  const actorEmail = input.actorAdminEmail?.trim().toLowerCase() || null
  const actorAdmin = actorEmail
    ? await prisma.adminUser.findUnique({ where: { email: actorEmail } })
    : null

  return prisma.vaultSubmissionEvent.create({
    data: {
      submissionId: input.submissionId,
      actorType: input.actorType,
      actorUserId: input.actorUserId ?? null,
      actorAdminId: actorAdmin?.id ?? null,
      eventType: input.eventType,
      metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
    },
  })
}

export async function createVaultSubmission(input: {
  category: string
  question: string
  userId?: string | null
  source?: VaultSubmissionRecord['source']
}) {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const record = await prisma.vaultSubmission.create({
    data: {
      category: input.category,
      question: input.question,
      userId: input.userId ?? null,
      source: input.source ?? 'app_authenticated',
    },
  })

  await createVaultSubmissionEvent({
    submissionId: record.id,
    actorType: input.userId ? 'user' : 'system',
    actorUserId: input.userId ?? null,
    eventType: 'submission.created',
    metadata: {
      category: record.category,
      source: record.source,
    },
  })

  return record
}

export async function listVaultSubmissions(actor?: {
  email: string
  role: AdminRole
}, options?: { includeIdentity?: boolean }): Promise<VaultSubmissionRecord[]> {
  if (!hasDatabaseConfig()) {
    return []
  }

  const includeIdentity = actor
    ? canViewVaultIdentity(actor.role) && options?.includeIdentity === true
    : false

  const records = await prisma.vaultSubmission.findMany({
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  if (actor && includeIdentity) {
    const revealedCount = records.reduce(
      (count: number, record: VaultSubmissionDbRecord) => count + (record.userId ? 1 : 0),
      0
    )

    if (revealedCount > 0) {
      await writeAuditLog({
        action: 'vault_submission.identity_viewed',
        entityType: 'vault_submission',
        actorEmail: actor.email,
        actorRole: actor.role,
        summary: `Viewed vault submission identities (${revealedCount} linked accounts)`,
        metadata: {
          revealedCount,
        },
      })
    }
  }

  return records.map((record: VaultSubmissionDbRecord) =>
    mapVaultSubmissionRecord(record, { includeIdentity })
  )
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

  await createVaultSubmissionEvent({
    submissionId: record.id,
    actorType: 'admin',
    actorAdminEmail: actor.email,
    eventType: 'submission.moderated',
    metadata: {
      status: input.status,
      approvedFaqTitle: record.approvedFaqTitle,
    },
  })

  return record
}

export async function createVaultResponse(
  input: {
    submissionId: string
    responseBody: string
  },
  actor: { email: string; role: AdminRole }
): Promise<{
  response: VaultResponseRecord
  notificationCreated: boolean
}> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const responseBody = input.responseBody.trim()

  if (!responseBody) {
    throw new Error('Response body is required')
  }

  const adminUser = await upsertAdminUserRecord(actor.email, actor.role)

  if (!adminUser) {
    throw new Error('Admin actor could not be resolved')
  }

  const now = new Date()

  const result = await prisma.$transaction(async (tx) => {
    const submission = await tx.vaultSubmission.findUnique({
      where: { id: input.submissionId },
      select: {
        id: true,
        userId: true,
        category: true,
      },
    })

    if (!submission) {
      throw new Error('Vault submission not found')
    }

    const notificationCreated = submission.userId !== null

    const response = await tx.vaultResponse.create({
      data: {
        submissionId: submission.id,
        responseBody,
        responderAdminId: adminUser.id,
        responderRole: actor.role,
        deliveredAt: notificationCreated ? now : null,
      },
    })

    await tx.vaultSubmission.update({
      where: { id: submission.id },
      data: {
        status: 'answered_privately',
      },
    })

    await tx.vaultSubmissionEvent.create({
      data: {
        submissionId: submission.id,
        actorType: 'admin',
        actorAdminId: adminUser.id,
        eventType: 'submission.responded',
        metadata: {
          responseId: response.id,
          responderRole: actor.role,
        },
      },
    })

    if (submission.userId) {
      await tx.userNotification.create({
        data: {
          userId: submission.userId,
          type: 'vault_response',
          title: 'You have a new V-Vault response',
          body: 'Dr. Didi has replied to your anonymous V-Vault submission.',
          entityType: 'vault_submission',
          entityId: submission.id,
        },
      })

      await tx.vaultSubmissionEvent.create({
        data: {
          submissionId: submission.id,
          actorType: 'system',
          eventType: 'submission.user_notified',
          metadata: {
            responseId: response.id,
            notificationType: 'vault_response',
          },
        },
      })
    }

    return {
      response,
      notificationCreated,
    }
  })

  await writeAuditLog({
    action: 'vault_submission.responded',
    entityType: 'vault_submission',
    entityId: input.submissionId,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: 'Responded to V-Vault submission',
    metadata: {
      responseId: result.response.id,
      notificationCreated: result.notificationCreated,
    },
  })

  return {
    response: mapVaultResponseRecord(result.response as VaultResponseDbRecord),
    notificationCreated: result.notificationCreated,
  }
}

export async function listUserVaultThreads(
  userId: string,
  options?: { take?: number }
): Promise<UserVaultThreadRecord[]> {
  if (!hasDatabaseConfig()) {
    return []
  }

  const take = options?.take ?? 30

  const records = await prisma.vaultSubmission.findMany({
    where: { userId },
    include: {
      responses: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take,
  })

  return (records as Array<{
    id: string
    category: string
    question: string
    status: VaultSubmissionRecord['status']
    createdAt: Date
    updatedAt: Date
    responses: VaultResponseDbRecord[]
  }>).map((record) => ({
    id: record.id,
    category: record.category,
    question: record.question,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    responses: record.responses.map((response: VaultResponseDbRecord) => mapVaultResponseRecord(response)),
  }))
}

export async function listUserNotifications(
  userId: string,
  options?: { take?: number }
): Promise<{
  notifications: UserNotificationRecord[]
  unreadCount: number
}> {
  if (!hasDatabaseConfig()) {
    return { notifications: [], unreadCount: 0 }
  }

  const take = options?.take ?? 30

  const [records, unreadCount] = await Promise.all([
    prisma.userNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    }),
    prisma.userNotification.count({ where: { userId, isRead: false } }),
  ])

  return {
    notifications: (records as UserNotificationDbRecord[]).map((record: UserNotificationDbRecord) =>
      mapUserNotificationRecord(record)
    ),
    unreadCount,
  }
}

export async function markUserNotificationRead(
  userId: string,
  notificationId: string
): Promise<UserNotificationRecord | null> {
  if (!hasDatabaseConfig()) {
    return null
  }

  const existing = await prisma.userNotification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  })

  if (!existing) {
    return null
  }

  const record = existing.isRead
    ? existing
    : await prisma.userNotification.update({
        where: { id: existing.id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

  return mapUserNotificationRecord(record as UserNotificationDbRecord)
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (!hasDatabaseConfig()) {
    return {
      adminUsers: 0,
      platformUsers: 0,
      mediaAssets: 0,
      auditLogs: 0,
      vaultSubmissions: 0,
      contactSubmissions: 0,
      teamMembers: 0,
      galleryImages: 0,
      reviews: 0,
      podcastEpisodes: 0,
      outreachEvents: 0,
      activeAlerts: 0,
      databaseReady: false,
    }
  }

  const [
    adminUsers,
    platformUsers,
    mediaAssets,
    auditLogs,
    vaultSubmissions,
    contactSubmissions,
    teamMembers,
    galleryImages,
    reviews,
    podcastEpisodes,
    outreachEvents,
    activeAlerts,
  ] = await Promise.all([
    prisma.adminUser.count(),
    prisma.user.count(),
    prisma.mediaAsset.count(),
    prisma.auditLog.count(),
    prisma.vaultSubmission.count(),
    prisma.contactSubmission.count(),
    prisma.teamMember.count().catch(() => 0),
    prisma.galleryImage.count().catch(() => 0),
    prisma.review.count().catch(() => 0),
    prisma.podcastEpisode.count().catch(() => 0),
    prisma.outreachEvent.count().catch(() => 0),
    prisma.siteAlert
      .count({
        where: {
          isActive: true,
          startsAt: { lte: new Date() },
          OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
        },
      })
      .catch(() => 0),
  ])

  return {
    adminUsers,
    platformUsers,
    mediaAssets,
    auditLogs,
    vaultSubmissions,
    contactSubmissions,
    teamMembers,
    galleryImages,
    reviews,
    podcastEpisodes,
    outreachEvents,
    activeAlerts,
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

  return records.map((r: {
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
  }) => ({
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

const IMAGE_FILE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const GALLERY_ASSET_EXCLUDE_NAMES = new Set([
  'founder-led-health-mobilization.jpg',
])

let localAssetFileSetCache: Set<string> | null = null

async function getLocalAssetFileSet(): Promise<Set<string>> {
  if (localAssetFileSetCache) {
    return localAssetFileSetCache
  }

  try {
    const assetsDir = path.join(process.cwd(), 'public', 'assets')
    const fileNames = await readdir(assetsDir)
    localAssetFileSetCache = new Set(fileNames.map((fileName) => fileName.toLowerCase()))
    return localAssetFileSetCache
  } catch {
    localAssetFileSetCache = new Set()
    return localAssetFileSetCache
  }
}

function galleryTitleFromFileName(fileName: string): string {
  const stem = fileName.replace(/\.[^.]+$/, '')
  const normalized = stem
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return normalized
    .split(' ')
    .filter(Boolean)
    .map((word) => (word.length <= 3 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join(' ')
}

function gallerySlugFromFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function inferFallbackGalleryCategory(fileName: string): GalleryImageCategory {
  const lower = fileName.toLowerCase()

  if (lower.includes('hospital') || lower.includes('facility') || lower.includes('bed')) {
    return 'facility'
  }

  if (lower.includes('community')) {
    return 'community'
  }

  if (lower.includes('outreach') || lower.startsWith('img-')) {
    return 'outreach'
  }

  return 'event'
}

async function getFallbackGalleryImages(category?: GalleryImageCategory): Promise<PublicGalleryImage[]> {
  const assetFileSet = await getLocalAssetFileSet()
  const teamImageFileNames = new Set(
    staticTeam
      .map((member) => member.image?.split('/').pop()?.toLowerCase())
      .filter((value): value is string => Boolean(value))
  )

  const seeded = gallerySeedItems
    .filter((item) => {
      const fileName = item.imageUrl.split('/').pop()?.toLowerCase()
      return Boolean(fileName && assetFileSet.has(fileName))
    })
    .map((item, index) => ({
      id: `seed-${item.slug}`,
      slug: item.slug,
      title: item.title,
      description: item.description,
      caption: item.caption || null,
      imageUrl: normalizePublicImageUrl(item.imageUrl),
      imageAlt: item.imageAlt,
      category: item.category as GalleryImageCategory,
      eventName: item.eventName || null,
      location: item.location || null,
      capturedAt: null,
      sortOrder: index,
    }))

  const seededFileNames = new Set(
    seeded
      .map((item) => item.imageUrl.split('/').pop()?.toLowerCase())
      .filter((value): value is string => Boolean(value))
  )

  const discovered = Array.from(assetFileSet)
    .filter((fileName) => IMAGE_FILE_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
    .filter((fileName) => !teamImageFileNames.has(fileName))
    .filter((fileName) => !GALLERY_ASSET_EXCLUDE_NAMES.has(fileName))
    .filter((fileName) => !seededFileNames.has(fileName))
    .sort((a, b) => a.localeCompare(b))
    .map((fileName, index) => {
      const title = galleryTitleFromFileName(fileName)
      const imageCategory = inferFallbackGalleryCategory(fileName)

      return {
        id: `asset-${fileName}`,
        slug: gallerySlugFromFileName(fileName),
        title,
        description: `Gallery highlight from Down Below Family Health Initiative featuring ${title.toLowerCase()}.`,
        caption: title,
        imageUrl: `/assets/${fileName}`,
        imageAlt: title,
        category: imageCategory,
        eventName: null,
        location: 'Cross River, Nigeria',
        capturedAt: null,
        sortOrder: seeded.length + index,
      }
    })

  const combined = [...seeded, ...discovered]
  if (!category) {
    return combined
  }

  return combined.filter((item) => item.category === category)
}

async function hasRenderableLocalAsset(imageUrl: string): Promise<boolean> {
  if (!imageUrl.startsWith('/assets/')) {
    return true
  }

  const fileName = imageUrl.split('/').pop()?.toLowerCase()
  if (!fileName) {
    return false
  }

  const assetFileSet = await getLocalAssetFileSet()
  return assetFileSet.has(fileName)
}

type GalleryImageDbRecord = {
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
}

function mapGalleryImage(r: GalleryImageDbRecord): GalleryImageRecord {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    caption: r.caption,
    imageUrl: normalizePublicImageUrl(r.imageUrl),
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

function fallbackToGalleryRecord(item: PublicGalleryImage): GalleryImageRecord {
  return {
    ...item,
    status: 'published',
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  }
}

function getSlugFromAuditMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null
  }

  const slug = (metadata as { slug?: unknown }).slug
  return typeof slug === 'string' ? slug : null
}

async function ensureFallbackGalleryRecords(): Promise<void> {
  const fallback = await getFallbackGalleryImages()
  if (fallback.length === 0) {
    return
  }

  const slugs = fallback.map((item) => item.slug)
  const existingRecords = await prisma.galleryImage.findMany({
    where: {
      slug: {
        in: slugs,
      },
    },
    select: {
      slug: true,
      imageUrl: true,
    },
  })
  const existingSlugs = new Set(existingRecords.map((record) => record.slug))
  const existingRecordsBySlug = new Map(existingRecords.map((record) => [record.slug, record]))
  const deletedSeedRecords = await prisma.auditLog.findMany({
    where: {
      action: 'gallery_image.deleted',
      entityType: 'gallery_image',
    },
    select: {
      metadata: true,
    },
  })
  const deletedSeedSlugs = new Set(
    deletedSeedRecords
      .map((record) => getSlugFromAuditMetadata(record.metadata))
      .filter((slug): slug is string => Boolean(slug))
  )
  const missingRecords = fallback.filter((item) => !existingSlugs.has(item.slug) && !deletedSeedSlugs.has(item.slug))

  const staleSeedRecords = fallback.filter((item) => {
    const existing = existingRecordsBySlug.get(item.slug)
    if (!existing || deletedSeedSlugs.has(item.slug)) {
      return false
    }

    const currentFileName = normalizePublicImageUrl(existing.imageUrl).split('/').pop()?.toLowerCase()
    const nextFileName = item.imageUrl.split('/').pop()?.toLowerCase()
    return Boolean(currentFileName && nextFileName && currentFileName !== nextFileName && GALLERY_ASSET_EXCLUDE_NAMES.has(currentFileName))
  })

  for (const item of missingRecords) {
    await prisma.galleryImage.create({
      data: {
        slug: item.slug,
        title: item.title,
        description: item.description,
        caption: item.caption,
        imageUrl: item.imageUrl,
        imageAlt: item.imageAlt,
        category: item.category,
        eventName: item.eventName,
        location: item.location,
        capturedAt: item.capturedAt ? new Date(item.capturedAt) : null,
        sortOrder: item.sortOrder,
        status: 'published',
      },
    })
  }

  for (const item of staleSeedRecords) {
    await prisma.galleryImage.update({
      where: { slug: item.slug },
      data: {
        title: item.title,
        description: item.description,
        caption: item.caption,
        imageUrl: item.imageUrl,
        imageAlt: item.imageAlt,
        category: item.category,
        eventName: item.eventName,
        location: item.location,
        capturedAt: item.capturedAt ? new Date(item.capturedAt) : null,
        sortOrder: item.sortOrder,
        status: 'published',
      },
    })
  }
}

export async function getPublishedGalleryImages(
  category?: GalleryImageCategory
): Promise<PublicGalleryImage[]> {
  const fallbackImages = await getFallbackGalleryImages(category)

  if (!hasDatabaseConfig()) {
    return fallbackImages
  }

  try {
    const records = await prisma.galleryImage.findMany({
      where: {
        status: 'published',
        ...(category ? { category } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })

    const normalizedRecords = await Promise.all(
      records.map(async (record: GalleryImageDbRecord) => ({
        id: record.id,
        slug: record.slug,
        title: record.title,
        description: record.description,
        caption: record.caption,
        imageUrl: normalizePublicImageUrl(record.imageUrl),
        imageAlt: record.imageAlt,
        category: record.category as GalleryImageCategory,
        eventName: record.eventName,
        location: record.location,
        capturedAt: record.capturedAt ? record.capturedAt.toISOString() : null,
        sortOrder: record.sortOrder,
        renderable: await hasRenderableLocalAsset(normalizePublicImageUrl(record.imageUrl)),
      }))
    )

    const safeRecords = normalizedRecords
      .filter((record) => record.renderable)
      .map((record) => ({
        id: record.id,
        slug: record.slug,
        title: record.title,
        description: record.description,
        caption: record.caption,
        imageUrl: record.imageUrl,
        imageAlt: record.imageAlt,
        category: record.category,
        eventName: record.eventName,
        location: record.location,
        capturedAt: record.capturedAt,
        sortOrder: record.sortOrder,
      }))

    if (safeRecords.length === 0) {
      return fallbackImages
    }

    return safeRecords
  } catch {
    return fallbackImages
  }
}

export async function getGalleryImageBySlug(
  slug: string
): Promise<PublicGalleryImage | null> {
  const fallbackImage = (await getFallbackGalleryImages()).find((item) => item.slug === slug) || null

  if (!hasDatabaseConfig()) {
    return fallbackImage
  }

  try {
    const r = await prisma.galleryImage.findUnique({
      where: { slug },
    })

    if (!r) {
      return fallbackImage
    }

    if (r.status !== 'published') {
      return null
    }

    const normalizedImageUrl = normalizePublicImageUrl(r.imageUrl)
    if (!(await hasRenderableLocalAsset(normalizedImageUrl))) {
      return fallbackImage
    }

    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      caption: r.caption,
      imageUrl: normalizedImageUrl,
      imageAlt: r.imageAlt,
      category: r.category as GalleryImageCategory,
      eventName: r.eventName,
      location: r.location,
      capturedAt: r.capturedAt ? r.capturedAt.toISOString() : null,
      sortOrder: r.sortOrder,
    }
  } catch {
    return fallbackImage
  }
}

export async function getAllGalleryImages(): Promise<GalleryImageRecord[]> {
  if (!hasDatabaseConfig()) {
    const fallback = await getFallbackGalleryImages()
    return fallback
      .map(fallbackToGalleryRecord)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }

  await ensureFallbackGalleryRecords()

  const records = await prisma.galleryImage.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })

  return records.map(mapGalleryImage).sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder
    }

    return a.title.localeCompare(b.title)
  })
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
    status?: 'draft' | 'published' | 'archived'
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

// ─────────────────────────────────────────────
// PODCAST EPISODES
// ─────────────────────────────────────────────

export type PodcastEpisodeStatus = 'draft' | 'published' | 'archived'

export type PublicPodcastEpisode = {
  id: string
  slug: string
  title: string
  summary: string
  description: string
  audioUrl: string
  audioSize: number | null
  audioType: string | null
  duration: number | null
  coverImage: string | null
  guestName: string | null
  topicTags: string[]
  transcript: string | null
  externalSourceUrl: string | null
  publishedAt: string | null
  sortOrder: number
}

export type PodcastEpisodeRecord = PublicPodcastEpisode & {
  status: PodcastEpisodeStatus
  createdAt: string
  updatedAt: string
}

type PodcastEpisodeDbRecord = {
  id: string
  slug: string
  title: string
  summary: string
  description: string
  audioUrl: string
  audioSize: number | null
  audioType: string | null
  duration: number | null
  coverImage: string | null
  guestName: string | null
  topicTags: unknown
  transcript: string | null
  externalSourceUrl: string | null
  publishedAt: Date | null
  sortOrder: number
  status: string
  createdAt: Date
  updatedAt: Date
}

function parseTopicTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
}

function mapPodcastEpisode(record: PodcastEpisodeDbRecord): PodcastEpisodeRecord {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    summary: record.summary,
    description: record.description,
    audioUrl: record.audioUrl,
    audioSize: record.audioSize,
    audioType: record.audioType,
    duration: record.duration,
    coverImage: record.coverImage,
    guestName: record.guestName,
    topicTags: parseTopicTags(record.topicTags),
    transcript: record.transcript,
    externalSourceUrl: record.externalSourceUrl,
    publishedAt: record.publishedAt ? record.publishedAt.toISOString() : null,
    sortOrder: record.sortOrder,
    status: record.status as PodcastEpisodeStatus,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function toPublicPodcastEpisode(record: PodcastEpisodeDbRecord): PublicPodcastEpisode {
  const episode = mapPodcastEpisode(record)

  return {
    id: episode.id,
    slug: episode.slug,
    title: episode.title,
    summary: episode.summary,
    description: episode.description,
    audioUrl: episode.audioUrl,
    audioSize: episode.audioSize,
    audioType: episode.audioType,
    duration: episode.duration,
    coverImage: episode.coverImage,
    guestName: episode.guestName,
    topicTags: episode.topicTags,
    transcript: episode.transcript,
    externalSourceUrl: episode.externalSourceUrl,
    publishedAt: episode.publishedAt,
    sortOrder: episode.sortOrder,
  }
}

export async function getPublishedPodcastEpisodes(): Promise<PublicPodcastEpisode[]> {
  if (!hasDatabaseConfig()) {
    return []
  }

  const records = await prisma.podcastEpisode.findMany({
    where: { status: 'published' },
    orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
  })

  return records.map(toPublicPodcastEpisode)
}

export async function getAllPodcastEpisodes(): Promise<PodcastEpisodeRecord[]> {
  if (!hasDatabaseConfig()) {
    return []
  }

  const records = await prisma.podcastEpisode.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })

  return records.map(mapPodcastEpisode)
}

export async function getPodcastEpisodeBySlug(slug: string): Promise<PublicPodcastEpisode | null> {
  if (!hasDatabaseConfig()) {
    return null
  }

  const record = await prisma.podcastEpisode.findFirst({
    where: { slug, status: 'published' },
  })

  return record ? toPublicPodcastEpisode(record) : null
}

export async function createPodcastEpisode(
  input: {
    slug: string
    title: string
    summary: string
    description: string
    audioUrl: string
    audioSize?: number
    audioType?: string
    duration?: number
    coverImage?: string
    guestName?: string
    topicTags?: string[]
    transcript?: string
    externalSourceUrl?: string
    publishedAt?: string
    sortOrder?: number
    status?: PodcastEpisodeStatus
  },
  actor: { email: string; role: AdminRole }
): Promise<PodcastEpisodeRecord> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const record = await prisma.podcastEpisode.create({
    data: {
      slug: input.slug.trim(),
      title: input.title.trim(),
      summary: input.summary.trim(),
      description: input.description.trim(),
      audioUrl: input.audioUrl.trim(),
      audioSize: input.audioSize ?? null,
      audioType: input.audioType?.trim() || null,
      duration: input.duration ?? null,
      coverImage: input.coverImage?.trim() || null,
      guestName: input.guestName?.trim() || null,
      topicTags: input.topicTags ?? [],
      transcript: input.transcript?.trim() || null,
      externalSourceUrl: input.externalSourceUrl?.trim() || null,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
      sortOrder: input.sortOrder ?? 0,
      status: input.status ?? 'published',
    },
  })

  await writeAuditLog({
    action: 'podcast_episode.created',
    entityType: 'podcast_episode',
    entityId: record.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Created podcast episode "${record.title}"`,
    metadata: { slug: record.slug, status: record.status },
  })

  return mapPodcastEpisode(record)
}

export async function updatePodcastEpisode(
  id: string,
  input: Partial<{
    slug: string
    title: string
    summary: string
    description: string
    audioUrl: string
    audioSize: number | null
    audioType: string | null
    duration: number | null
    coverImage: string | null
    guestName: string | null
    topicTags: string[]
    transcript: string | null
    externalSourceUrl: string | null
    publishedAt: string | null
    sortOrder: number
    status: PodcastEpisodeStatus
  }>,
  actor: { email: string; role: AdminRole }
): Promise<PodcastEpisodeRecord> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const record = await prisma.podcastEpisode.update({
    where: { id },
    data: {
      ...(input.slug !== undefined && { slug: input.slug.trim() }),
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.summary !== undefined && { summary: input.summary.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(input.audioUrl !== undefined && { audioUrl: input.audioUrl.trim() }),
      ...(input.audioSize !== undefined && { audioSize: input.audioSize }),
      ...(input.audioType !== undefined && { audioType: input.audioType?.trim() || null }),
      ...(input.duration !== undefined && { duration: input.duration }),
      ...(input.coverImage !== undefined && { coverImage: input.coverImage?.trim() || null }),
      ...(input.guestName !== undefined && { guestName: input.guestName?.trim() || null }),
      ...(input.topicTags !== undefined && { topicTags: input.topicTags }),
      ...(input.transcript !== undefined && { transcript: input.transcript?.trim() || null }),
      ...(input.externalSourceUrl !== undefined && {
        externalSourceUrl: input.externalSourceUrl?.trim() || null,
      }),
      ...(input.publishedAt !== undefined && {
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
      }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      ...(input.status !== undefined && { status: input.status }),
    },
  })

  await writeAuditLog({
    action: 'podcast_episode.updated',
    entityType: 'podcast_episode',
    entityId: record.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Updated podcast episode "${record.title}"`,
    metadata: { slug: record.slug, changedFields: Object.keys(input) },
  })

  return mapPodcastEpisode(record)
}

export async function deletePodcastEpisode(
  id: string,
  actor: { email: string; role: AdminRole }
): Promise<void> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const record = await prisma.podcastEpisode.delete({ where: { id } })

  await writeAuditLog({
    action: 'podcast_episode.deleted',
    entityType: 'podcast_episode',
    entityId: id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Deleted podcast episode "${record.title}"`,
    metadata: { slug: record.slug },
  })
}

export type EventStatus = 'draft' | 'published' | 'archived'
export type EventCommentStatus = 'visible' | 'hidden' | 'flagged'

export type EventRecord = {
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
  status: EventStatus
  publishedAt: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  _count: {
    likes: number
    comments: number
  }
}

export type EventCommentRecord = {
  id: string
  eventId: string
  userId: string
  displayName: string
  body: string
  status: EventCommentStatus
  createdAt: string
  updatedAt: string
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
  status: string
  publishedAt: Date | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  _count: {
    likes: number
    comments: number
  }
}

type EventCommentDbRecord = {
  id: string
  eventId: string
  userId: string
  displayName: string
  body: string
  status: string
  createdAt: Date
  updatedAt: Date
}

function mapEventRecord(record: EventDbRecord): EventRecord {
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
    status: record.status as EventStatus,
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

function mapEventCommentRecord(record: EventCommentDbRecord): EventCommentRecord {
  return {
    id: record.id,
    eventId: record.eventId,
    userId: record.userId,
    displayName: record.displayName,
    body: record.body,
    status: record.status as EventCommentStatus,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function normalizeEventStatus(status: EventStatus = 'draft') {
  return status
}

function eventDateFromIso(value?: string | null): Date | null {
  if (!value) {
    return null
  }

  return new Date(value)
}

const eventsModels = prisma as unknown as {
  outreachEvent: {
    findMany: (...args: unknown[]) => Promise<unknown[]>
    findUnique: (...args: unknown[]) => Promise<unknown>
    create: (...args: unknown[]) => Promise<unknown>
    update: (...args: unknown[]) => Promise<unknown>
    delete: (...args: unknown[]) => Promise<unknown>
  }
  eventComment: {
    findMany: (...args: unknown[]) => Promise<unknown[]>
    findFirst: (...args: unknown[]) => Promise<unknown>
    update: (...args: unknown[]) => Promise<unknown>
  }
}

export async function getAllEvents(): Promise<EventRecord[]> {
  if (!hasDatabaseConfig()) {
    return []
  }

  const records = await eventsModels.outreachEvent.findMany({
    orderBy: [{ sortOrder: 'asc' }, { scheduledAt: 'asc' }, { createdAt: 'desc' }],
    include: {
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  })

  return records.map((record) => mapEventRecord(record as EventDbRecord))
}

export async function getEventById(id: string): Promise<EventRecord | null> {
  if (!hasDatabaseConfig()) {
    return null
  }

  const record = await eventsModels.outreachEvent.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  })

  if (!record) {
    return null
  }

  return mapEventRecord(record as EventDbRecord)
}

export async function createEvent(
  input: {
    slug: string
    title: string
    summary: string
    body?: string
    coverImageUrl?: string
    coverImageAlt?: string
    communityLabel?: string
    location?: string
    scheduledAt?: string
    endedAt?: string
    streamUrl?: string
    streamProvider?: string
    isLive?: boolean
    engagementEnabled?: boolean
    status?: EventStatus
    publishedAt?: string
    sortOrder?: number
  },
  actor: { email: string; role: AdminRole }
): Promise<EventRecord> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const record = (await eventsModels.outreachEvent.create({
    data: {
      slug: input.slug.trim(),
      title: input.title.trim(),
      summary: input.summary.trim(),
      body: input.body?.trim() || null,
      coverImageUrl: input.coverImageUrl?.trim() || null,
      coverImageAlt: input.coverImageAlt?.trim() || null,
      communityLabel: input.communityLabel?.trim() || null,
      location: input.location?.trim() || null,
      scheduledAt: eventDateFromIso(input.scheduledAt),
      endedAt: eventDateFromIso(input.endedAt),
      streamUrl: input.streamUrl?.trim() || null,
      streamProvider: input.streamProvider?.trim() || null,
      isLive: input.isLive ?? false,
      engagementEnabled: input.engagementEnabled ?? true,
      status: normalizeEventStatus(input.status),
      publishedAt: eventDateFromIso(input.publishedAt),
      sortOrder: input.sortOrder ?? 0,
    },
    include: {
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  })) as EventDbRecord

  await writeAuditLog({
    action: 'events.create',
    entityType: 'outreach_event',
    entityId: record.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Created event "${record.title}"`,
    metadata: {
      slug: record.slug,
      status: record.status,
      scheduledAt: record.scheduledAt ? record.scheduledAt.toISOString() : null,
    },
  })

  return mapEventRecord(record as EventDbRecord)
}

export async function updateEvent(
  id: string,
  input: Partial<{
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
    status: EventStatus
    publishedAt: string | null
    sortOrder: number
  }>,
  actor: { email: string; role: AdminRole }
): Promise<EventRecord> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const record = (await eventsModels.outreachEvent.update({
    where: { id },
    data: {
      ...(input.slug !== undefined && { slug: input.slug.trim() }),
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.summary !== undefined && { summary: input.summary.trim() }),
      ...(input.body !== undefined && { body: input.body?.trim() || null }),
      ...(input.coverImageUrl !== undefined && { coverImageUrl: input.coverImageUrl?.trim() || null }),
      ...(input.coverImageAlt !== undefined && { coverImageAlt: input.coverImageAlt?.trim() || null }),
      ...(input.communityLabel !== undefined && { communityLabel: input.communityLabel?.trim() || null }),
      ...(input.location !== undefined && { location: input.location?.trim() || null }),
      ...(input.scheduledAt !== undefined && { scheduledAt: eventDateFromIso(input.scheduledAt) }),
      ...(input.endedAt !== undefined && { endedAt: eventDateFromIso(input.endedAt) }),
      ...(input.streamUrl !== undefined && { streamUrl: input.streamUrl?.trim() || null }),
      ...(input.streamProvider !== undefined && { streamProvider: input.streamProvider?.trim() || null }),
      ...(input.isLive !== undefined && { isLive: input.isLive }),
      ...(input.engagementEnabled !== undefined && { engagementEnabled: input.engagementEnabled }),
      ...(input.status !== undefined && { status: normalizeEventStatus(input.status) }),
      ...(input.publishedAt !== undefined && { publishedAt: eventDateFromIso(input.publishedAt) }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    },
    include: {
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  })) as EventDbRecord

  await writeAuditLog({
    action: 'events.update',
    entityType: 'outreach_event',
    entityId: record.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Updated event "${record.title}"`,
    metadata: {
      slug: record.slug,
      changedFields: Object.keys(input),
    },
  })

  return mapEventRecord(record as EventDbRecord)
}

export async function deleteEvent(
  id: string,
  actor: { email: string; role: AdminRole }
): Promise<void> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const record = (await eventsModels.outreachEvent.delete({ where: { id } })) as EventDbRecord

  await writeAuditLog({
    action: 'events.delete',
    entityType: 'outreach_event',
    entityId: id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Deleted event "${record.title}"`,
    metadata: { slug: record.slug },
  })
}

export async function getEventComments(eventId: string): Promise<EventCommentRecord[]> {
  if (!hasDatabaseConfig()) {
    return []
  }

  const records = await eventsModels.eventComment.findMany({
    where: { eventId },
    orderBy: [{ createdAt: 'desc' }],
  })

  return records.map((record: unknown) => mapEventCommentRecord(record as EventCommentDbRecord))
}

export async function moderateEventComment(
  eventId: string,
  commentId: string,
  status: EventCommentStatus,
  actor: { email: string; role: AdminRole }
): Promise<EventCommentRecord> {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured')
  }

  const existingComment = (await eventsModels.eventComment.findFirst({
    where: {
      id: commentId,
      eventId,
    },
  })) as EventCommentDbRecord | null

  if (!existingComment) {
    throw new Error('Event comment not found')
  }

  const record = (await eventsModels.eventComment.update({
    where: { id: commentId },
    data: { status },
  })) as EventCommentDbRecord

  await writeAuditLog({
    action: 'events.comment.moderate',
    entityType: 'event_comment',
    entityId: record.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    summary: `Moderated event comment ${record.id}`,
    metadata: {
      eventId: record.eventId,
      status,
    },
  })

  return mapEventCommentRecord(record as EventCommentDbRecord)
}

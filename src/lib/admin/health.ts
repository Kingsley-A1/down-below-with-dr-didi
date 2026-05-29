import { prisma } from '@/lib/prisma'
import { getAdminHealthEnvStatus, hasDatabaseConfig, hasEmailProvider, hasR2Config } from '@/lib/env'
import { OPERATOR_ERROR_REFERENCE, type OperatorErrorReference } from '@/lib/api/error-reference'

export type HealthStatus = 'operational' | 'degraded' | 'blocked'
type DependencyKey = 'database' | 'email' | 'storage' | 'admin_env'
type RouteLayer = 'public_page' | 'admin_page' | 'api_route'

export interface DependencyHealth {
  key: DependencyKey
  label: string
  status: HealthStatus
  reason: string
  operatorAction: string
}

export interface TableHealth {
  key: string
  label: string
  model: string
  status: HealthStatus
  count: number | null
  reason: string
  operatorAction: string
}

export interface RouteHealth {
  layer: RouteLayer
  name: string
  route: string
  methods: string[]
  status: HealthStatus
  dependencies: DependencyKey[]
  dataModels: string[]
  reason: string
  operatorAction: string
}

export interface AdminHealthSnapshot {
  ok: true
  requestId: string
  timestamp: string
  database: {
    configured: boolean
    reachable: boolean
  }
  email: {
    provider: 'resend' | null
    configured: boolean
  }
  storage: {
    configured: boolean
  }
  adminEnv: {
    sessionSecretSet: boolean
    accessCodesConfigured: number
  }
  adminUsers: {
    total: number
    active: number
    unverified: number
    locked: number
  }
  dependencies: DependencyHealth[]
  tables: TableHealth[]
  routes: RouteHealth[]
  errorReference: OperatorErrorReference[]
}

interface TableProbe {
  key: string
  label: string
  model: string
  count: () => Promise<number>
}

interface RouteDefinition {
  layer: RouteLayer
  name: string
  route: string
  methods: string[]
  dependencies: DependencyKey[]
  dataModels: string[]
  hasPublicFallback?: boolean
}

interface HealthProbeError {
  probe: TableProbe
  error: unknown
}

interface HealthSnapshotOptions {
  requestId: string
  onProbeError?: (input: HealthProbeError) => void
}

const TABLE_PROBES: TableProbe[] = [
  { key: 'adminUsers', label: 'Admin accounts', model: 'AdminUser', count: () => prisma.adminUser.count() },
  { key: 'users', label: 'Member accounts', model: 'User', count: () => prisma.user.count() },
  { key: 'siteSettings', label: 'Site settings', model: 'SiteSettings', count: () => prisma.siteSettings.count() },
  { key: 'siteAlerts', label: 'Site alerts', model: 'SiteAlert', count: () => prisma.siteAlert.count() },
  { key: 'mediaAssets', label: 'Media assets', model: 'MediaAsset', count: () => prisma.mediaAsset.count() },
  { key: 'articles', label: 'Library articles', model: 'Article', count: () => prisma.article.count() },
  { key: 'events', label: 'Events', model: 'OutreachEvent', count: () => prisma.outreachEvent.count() },
  { key: 'eventComments', label: 'Event comments', model: 'EventComment', count: () => prisma.eventComment.count() },
  { key: 'eventLikes', label: 'Event likes', model: 'EventLike', count: () => prisma.eventLike.count() },
  { key: 'contactSubmissions', label: 'Contact submissions', model: 'ContactSubmission', count: () => prisma.contactSubmission.count() },
  { key: 'vaultSubmissions', label: 'V-Vault submissions', model: 'VaultSubmission', count: () => prisma.vaultSubmission.count() },
  { key: 'vaultResponses', label: 'V-Vault responses', model: 'VaultResponse', count: () => prisma.vaultResponse.count() },
  { key: 'notifications', label: 'User notifications', model: 'UserNotification', count: () => prisma.userNotification.count() },
  { key: 'reviews', label: 'Reviews', model: 'Review', count: () => prisma.review.count() },
  { key: 'reviewHelpfuls', label: 'Review helpful marks', model: 'ReviewHelpful', count: () => prisma.reviewHelpful.count() },
  { key: 'teamMembers', label: 'Team members', model: 'TeamMember', count: () => prisma.teamMember.count() },
  { key: 'galleryImages', label: 'Gallery images', model: 'GalleryImage', count: () => prisma.galleryImage.count() },
  { key: 'podcastEpisodes', label: 'Podcast episodes', model: 'PodcastEpisode', count: () => prisma.podcastEpisode.count() },
  { key: 'auditLogs', label: 'Audit logs', model: 'AuditLog', count: () => prisma.auditLog.count() },
  { key: 'rateLimitBuckets', label: 'Rate limit buckets', model: 'RateLimitBucket', count: () => prisma.rateLimitBucket.count() },
]

const ROUTE_DEFINITIONS: RouteDefinition[] = [
  { layer: 'public_page', name: 'Home', route: '/', methods: ['GET'], dependencies: ['database'], dataModels: ['SiteSettings', 'Article', 'Review', 'OutreachEvent'], hasPublicFallback: true },
  { layer: 'public_page', name: 'About', route: '/about', methods: ['GET'], dependencies: ['database'], dataModels: ['SiteSettings', 'TeamMember'], hasPublicFallback: true },
  { layer: 'public_page', name: 'Contact', route: '/contact', methods: ['GET'], dependencies: ['database'], dataModels: ['SiteSettings'], hasPublicFallback: true },
  { layer: 'public_page', name: 'Events', route: '/events', methods: ['GET'], dependencies: ['database'], dataModels: ['OutreachEvent'], hasPublicFallback: true },
  { layer: 'public_page', name: 'Event detail', route: '/events/[slug]', methods: ['GET'], dependencies: ['database'], dataModels: ['OutreachEvent', 'EventComment', 'EventLike'], hasPublicFallback: true },
  { layer: 'public_page', name: 'Library', route: '/library', methods: ['GET'], dependencies: ['database'], dataModels: ['Article'], hasPublicFallback: true },
  { layer: 'public_page', name: 'Article detail', route: '/library/[slug]', methods: ['GET'], dependencies: ['database'], dataModels: ['Article'], hasPublicFallback: true },
  { layer: 'public_page', name: 'Outreach', route: '/outreach', methods: ['GET'], dependencies: ['database'], dataModels: ['OutreachEvent'], hasPublicFallback: true },
  { layer: 'public_page', name: 'Podcast', route: '/podcast', methods: ['GET'], dependencies: ['database'], dataModels: ['PodcastEpisode'], hasPublicFallback: true },
  { layer: 'public_page', name: 'Podcast detail', route: '/podcast/[slug]', methods: ['GET'], dependencies: ['database'], dataModels: ['PodcastEpisode'], hasPublicFallback: true },
  { layer: 'public_page', name: 'Gallery', route: '/gallery', methods: ['GET'], dependencies: ['database'], dataModels: ['GalleryImage'], hasPublicFallback: true },
  { layer: 'public_page', name: 'Gallery detail', route: '/gallery/[slug]', methods: ['GET'], dependencies: ['database'], dataModels: ['GalleryImage'], hasPublicFallback: true },
  { layer: 'public_page', name: 'Team', route: '/team', methods: ['GET'], dependencies: ['database'], dataModels: ['TeamMember'], hasPublicFallback: true },
  { layer: 'public_page', name: 'Reviews', route: '/review', methods: ['GET'], dependencies: ['database'], dataModels: ['Review'], hasPublicFallback: true },
  { layer: 'public_page', name: 'V-Vault', route: '/vault', methods: ['GET'], dependencies: ['database'], dataModels: ['VaultSubmission', 'VaultResponse', 'UserNotification'] },
  { layer: 'public_page', name: 'My account', route: '/me', methods: ['GET'], dependencies: ['database'], dataModels: ['User', 'VaultSubmission', 'UserNotification'] },
  { layer: 'public_page', name: 'Public auth', route: '/login, /register, /forgot-password, /reset-password, /verify-email', methods: ['GET'], dependencies: ['database', 'email'], dataModels: ['User'] },
  { layer: 'public_page', name: 'Legal and SEO assets', route: '/terms, /privacy, /robots.txt, /sitemap.xml, /manifest.webmanifest', methods: ['GET'], dependencies: [], dataModels: [] },
  { layer: 'api_route', name: 'Site alert API', route: '/api/alerts/active', methods: ['GET'], dependencies: ['database'], dataModels: ['SiteAlert'] },
  { layer: 'api_route', name: 'Public auth APIs', route: '/api/auth/*', methods: ['GET', 'POST'], dependencies: ['database', 'email'], dataModels: ['User', 'RateLimitBucket'] },
  { layer: 'api_route', name: 'Contact API', route: '/api/contact', methods: ['POST'], dependencies: ['database'], dataModels: ['ContactSubmission', 'RateLimitBucket'] },
  { layer: 'api_route', name: 'V-Vault APIs', route: '/api/vault, /api/vault/me', methods: ['GET', 'POST'], dependencies: ['database', 'email'], dataModels: ['VaultSubmission', 'VaultResponse', 'UserNotification', 'RateLimitBucket'] },
  { layer: 'api_route', name: 'Events APIs', route: '/api/events/*', methods: ['GET', 'POST'], dependencies: ['database'], dataModels: ['OutreachEvent', 'EventComment', 'EventLike'] },
  { layer: 'api_route', name: 'Reviews APIs', route: '/api/reviews/*', methods: ['GET', 'POST'], dependencies: ['database'], dataModels: ['Review', 'ReviewHelpful'] },
  { layer: 'api_route', name: 'Gallery APIs', route: '/api/gallery/*', methods: ['GET'], dependencies: ['database'], dataModels: ['GalleryImage'] },
  { layer: 'api_route', name: 'User notification APIs', route: '/api/users/*', methods: ['GET', 'PATCH'], dependencies: ['database'], dataModels: ['User', 'UserNotification'] },
  { layer: 'admin_page', name: 'Admin dashboard', route: '/admin', methods: ['GET'], dependencies: ['database', 'admin_env'], dataModels: ['AdminUser', 'AuditLog'] },
  { layer: 'admin_page', name: 'Admin content boards', route: '/admin/settings, /admin/alerts, /admin/team, /admin/gallery, /admin/events, /admin/library, /admin/podcast, /admin/reviews', methods: ['GET'], dependencies: ['database', 'admin_env'], dataModels: ['SiteSettings', 'SiteAlert', 'TeamMember', 'GalleryImage', 'OutreachEvent', 'Article', 'PodcastEpisode', 'Review'] },
  { layer: 'admin_page', name: 'Admin media', route: '/admin/media', methods: ['GET'], dependencies: ['database', 'storage', 'admin_env'], dataModels: ['MediaAsset'] },
  { layer: 'admin_page', name: 'Admin users', route: '/admin/users, /admin/admin-users', methods: ['GET'], dependencies: ['database', 'email', 'admin_env'], dataModels: ['User', 'AdminUser', 'AuditLog'] },
  { layer: 'admin_page', name: 'Admin V-Vault', route: '/admin/vault', methods: ['GET'], dependencies: ['database', 'email', 'admin_env'], dataModels: ['VaultSubmission', 'VaultResponse', 'UserNotification'] },
  { layer: 'admin_page', name: 'Admin health', route: '/admin/health', methods: ['GET'], dependencies: ['database', 'admin_env'], dataModels: ['AdminUser'] },
  { layer: 'api_route', name: 'Admin APIs', route: '/api/admin/*', methods: ['GET', 'POST', 'PUT', 'DELETE'], dependencies: ['database', 'email', 'storage', 'admin_env'], dataModels: ['AdminUser', 'AuditLog', 'MediaAsset'] },
]

function getErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code
    return typeof code === 'string' ? code : null
  }

  return null
}

async function runTableProbe(
  probe: TableProbe,
  databaseConfigured: boolean,
  onProbeError?: HealthSnapshotOptions['onProbeError']
): Promise<TableHealth> {
  if (!databaseConfigured) {
    return {
      key: probe.key,
      label: probe.label,
      model: probe.model,
      status: 'blocked',
      count: null,
      reason: 'DATABASE_URL is not configured.',
      operatorAction: 'Set DATABASE_URL, deploy migrations, then rebuild or redeploy.',
    }
  }

  try {
    const count = await probe.count()
    return {
      key: probe.key,
      label: probe.label,
      model: probe.model,
      status: 'operational',
      count,
      reason: `${probe.model} is queryable.`,
      operatorAction: 'No action needed.',
    }
  } catch (error) {
    onProbeError?.({ probe, error })
    const errorCode = getErrorCode(error)
    return {
      key: probe.key,
      label: probe.label,
      model: probe.model,
      status: 'blocked',
      count: null,
      reason: errorCode ? `${probe.model} query failed with ${errorCode}.` : `${probe.model} query failed.`,
      operatorAction: 'Check the database connection, Prisma migrations, and the server log for this request ID.',
    }
  }
}

function makeDependencyStates(input: {
  databaseConfigured: boolean
  databaseReachable: boolean
  emailConfigured: boolean
  storageConfigured: boolean
  sessionSecretSet: boolean
  accessCodesConfigured: number
}): Record<DependencyKey, DependencyHealth> {
  return {
    database: {
      key: 'database',
      label: 'CockroachDB / Prisma',
      status: !input.databaseConfigured ? 'blocked' : input.databaseReachable ? 'operational' : 'blocked',
      reason: !input.databaseConfigured
        ? 'DATABASE_URL is missing.'
        : input.databaseReachable
          ? 'Database probes are returning successfully.'
          : 'Database probes could not reach one or more required tables.',
      operatorAction: !input.databaseConfigured || !input.databaseReachable
        ? 'Verify DATABASE_URL, run prisma migrate deploy, and inspect provider connectivity.'
        : 'No action needed.',
    },
    email: {
      key: 'email',
      label: 'Resend email',
      status: input.emailConfigured ? 'operational' : 'degraded',
      reason: input.emailConfigured ? 'Email provider is configured.' : 'RESEND_API_KEY is not configured.',
      operatorAction: input.emailConfigured ? 'No action needed.' : 'Set RESEND_API_KEY and verified sender values before relying on transactional email.',
    },
    storage: {
      key: 'storage',
      label: 'Cloudflare R2 media',
      status: input.storageConfigured ? 'operational' : 'degraded',
      reason: input.storageConfigured ? 'R2 configuration is present.' : 'One or more R2 environment variables are missing.',
      operatorAction: input.storageConfigured ? 'No action needed.' : 'Set R2 account ID, bucket, access keys, public URL, and CORS policy.',
    },
    admin_env: {
      key: 'admin_env',
      label: 'Admin auth environment',
      status: input.sessionSecretSet && input.accessCodesConfigured >= 4 ? 'operational' : 'blocked',
      reason: input.sessionSecretSet && input.accessCodesConfigured >= 4
        ? 'Admin session secret and role codes are configured.'
        : 'Admin session secret or role-code configuration is incomplete.',
      operatorAction: input.sessionSecretSet && input.accessCodesConfigured >= 4
        ? 'No action needed.'
        : 'Set ADMIN_SESSION_SECRET and all four role access codes, then redeploy.',
    },
  }
}

function selectWorstStatus(statuses: HealthStatus[]): HealthStatus {
  if (statuses.includes('blocked')) {
    return 'blocked'
  }

  if (statuses.includes('degraded')) {
    return 'degraded'
  }

  return 'operational'
}

function buildRouteHealth(
  definition: RouteDefinition,
  dependencies: Record<DependencyKey, DependencyHealth>,
  tableByModel: Map<string, TableHealth>
): RouteHealth {
  const dependencyStates = definition.dependencies.map((dependency) => dependencies[dependency])
  const tableStates = definition.dataModels
    .map((model) => tableByModel.get(model))
    .filter((table): table is TableHealth => Boolean(table))

  const dependencyStatus = selectWorstStatus(dependencyStates.map((dependency) => dependency.status))
  const tableStatus = selectWorstStatus(tableStates.map((table) => table.status))
  const rawStatus = selectWorstStatus([dependencyStatus, tableStatus])
  const status = rawStatus === 'blocked' && definition.hasPublicFallback ? 'degraded' : rawStatus
  const failingDependency = dependencyStates.find((dependency) => dependency.status !== 'operational')
  const failingTable = tableStates.find((table) => table.status !== 'operational')

  return {
    ...definition,
    status,
    reason: failingDependency?.reason ?? failingTable?.reason ?? 'All declared dependencies are healthy.',
    operatorAction: failingDependency?.operatorAction ?? failingTable?.operatorAction ?? 'No action needed.',
  }
}

function countByKey(tables: TableHealth[], key: string): number {
  return tables.find((table) => table.key === key)?.count ?? 0
}

export async function getAdminHealthSnapshot(options: HealthSnapshotOptions): Promise<AdminHealthSnapshot> {
  const databaseConfigured = hasDatabaseConfig()
  const tables = await Promise.all(
    TABLE_PROBES.map((probe) => runTableProbe(probe, databaseConfigured, options.onProbeError))
  )
  const databaseReachable = databaseConfigured && tables.some((table) => table.status === 'operational')
  const now = new Date()
  const adminEnv = getAdminHealthEnvStatus()
  const dependencies = makeDependencyStates({
    databaseConfigured,
    databaseReachable,
    emailConfigured: hasEmailProvider(),
    storageConfigured: hasR2Config(),
    sessionSecretSet: adminEnv.sessionSecretSet,
    accessCodesConfigured: adminEnv.accessCodesConfigured,
  })
  const tableByModel = new Map(tables.map((table) => [table.model, table]))
  const routes = ROUTE_DEFINITIONS.map((definition) => buildRouteHealth(definition, dependencies, tableByModel))

  let activeAdminUsers = 0
  let unverifiedAdminUsers = 0
  let lockedAdminUsers = 0

  if (databaseReachable) {
    try {
      const [active, unverified, locked] = await Promise.all([
        prisma.adminUser.count({ where: { isActive: true } }),
        prisma.adminUser.count({ where: { emailVerified: false } }),
        prisma.adminUser.count({ where: { lockoutUntil: { gt: now } } }),
      ])
      activeAdminUsers = active
      unverifiedAdminUsers = unverified
      lockedAdminUsers = locked
    } catch {
      activeAdminUsers = 0
      unverifiedAdminUsers = 0
      lockedAdminUsers = 0
    }
  }

  return {
    ok: true,
    requestId: options.requestId,
    timestamp: now.toISOString(),
    database: {
      configured: databaseConfigured,
      reachable: databaseReachable,
    },
    email: {
      provider: hasEmailProvider() ? 'resend' : null,
      configured: hasEmailProvider(),
    },
    storage: {
      configured: hasR2Config(),
    },
    adminEnv,
    adminUsers: {
      total: countByKey(tables, 'adminUsers'),
      active: activeAdminUsers,
      unverified: unverifiedAdminUsers,
      locked: lockedAdminUsers,
    },
    dependencies: Object.values(dependencies),
    tables,
    routes,
    errorReference: OPERATOR_ERROR_REFERENCE,
  }
}

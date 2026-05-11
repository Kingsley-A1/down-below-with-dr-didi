import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import {
  generateEmailVerificationToken,
  generatePasswordResetToken,
  isTokenExpired,
} from '@/lib/auth/token'

/**
 * User record for API responses (excludes sensitive fields)
 */
export type PublicUserRecord = {
  id: string
  email: string
  displayName: string
  phone?: string | null
  role: string
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Database user record (with sensitive fields for internal use)
 */
type UserDbRecord = {
  id: string
  email: string
  displayName: string
  phone: string | null
  role: string
  passwordHash: string
  isActive: boolean
  emailVerified: boolean
  emailVerifyToken: string | null
  emailVerifyTokenExpiry: Date | null
  resetToken: string | null
  resetTokenExpiry: Date | null
  phoneVerifyCode: string | null
  phoneVerifyExpiry: Date | null
  lastActivityAt: Date
  createdAt: Date
  updatedAt: Date
}

type UserAuditLogRecord = {
  id: string
  action: string
  entityType: string
  summary: string
  ipAddress: string | null
  userAgent: string | null
  success: boolean
  createdAt: Date
}

export type PublicUserAuditLogRecord = {
  id: string
  action: string
  entityType: string
  summary: string
  ipAddress: string | null
  userAgent: string | null
  success: boolean
  createdAt: string
}

/**
 * Find user by email
 */
export async function getUserByEmail(email: string): Promise<PublicUserRecord | null> {
  try {
    const user = (await prisma.user.findUnique({
      where: { email },
    })) as UserDbRecord | null

    if (!user) return null

    return mapToPublicRecord(user)
  } catch (error) {
    console.error('Error fetching user by email:', error)
    throw error
  }
}

/**
 * Find user by ID
 */
export async function getUserById(userId: string): Promise<PublicUserRecord | null> {
  try {
    const user = (await prisma.user.findUnique({
      where: { id: userId },
    })) as UserDbRecord | null

    if (!user) return null

    return mapToPublicRecord(user)
  } catch (error) {
    console.error('Error fetching user by ID:', error)
    throw error
  }
}

/**
 * Create new user with email verification flow
 */
export async function createUser(
  email: string,
  displayName: string,
  password: string,
  phone?: string
): Promise<{ user: PublicUserRecord; verificationToken: string } | null> {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const passwordHash = await hashPassword(password)
    const { token: emailVerifyToken } = generateEmailVerificationToken()
    const emailVerifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const user = (await prisma.user.create({
      data: {
        email,
        displayName,
        passwordHash,
        emailVerifyToken,
        emailVerifyTokenExpiry,
        phone: phone || null,
        role: 'member',
      },
    })) as UserDbRecord

    // Audit log: user registration
    await logAuditEvent({
      action: 'user.register',
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
      actorEmail: email,
      summary: `User registered: ${displayName} <${email}>`,
    })

    return {
      user: mapToPublicRecord(user),
      verificationToken: emailVerifyToken,
    }
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

/**
 * Verify user email with token
 * Checks if token exists and has not expired (24h validity)
 */
export async function verifyUserEmail(token: string): Promise<boolean> {
  try {
    const user = (await prisma.user.findUnique({
      where: { emailVerifyToken: token },
    })) as UserDbRecord | null

    if (!user) {
      console.error('Email verification token not found')
      return false
    }

    // Check if token has expired (24-hour window)
    const now = new Date()
    if (user.emailVerifyTokenExpiry && now > user.emailVerifyTokenExpiry) {
      console.error('Email verification token expired')
      return false
    }

    // Token check happens implicitly - unique constraint ensures one match
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyTokenExpiry: null,
      },
    })

    // Audit log: email verified
    await logAuditEvent({
      action: 'user.email_verified',
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
      actorEmail: user.email,
      summary: `Email verified for ${user.email}`,
    })

    return true
  } catch (error) {
    console.error('Error verifying user email:', error)
    throw error
  }
}

/**
 * Authenticate user (login)
 * Returns user if credentials valid, null otherwise
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<PublicUserRecord | null> {
  try {
    const user = (await prisma.user.findUnique({
      where: { email },
    })) as UserDbRecord | null

    if (!user) {
      // Audit: failed login
      await logAuditEvent({
        action: 'user.login_failed',
        entityType: 'User',
        entityId: undefined,
        actorEmail: email,
        summary: `Login failed: User not found`,
        success: false,
      })
      return null
    }

    if (!user.isActive) {
      await logAuditEvent({
        action: 'user.login_failed',
        entityType: 'User',
        entityId: user.id,
        userId: user.id,
        actorEmail: email,
        summary: `Login failed: Account deactivated`,
        success: false,
      })
      return null
    }

    const passwordValid = await verifyPassword(password, user.passwordHash)

    if (!passwordValid) {
      await logAuditEvent({
        action: 'user.login_failed',
        entityType: 'User',
        entityId: user.id,
        userId: user.id,
        actorEmail: email,
        summary: `Login failed: Invalid password`,
        success: false,
      })
      return null
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActivityAt: new Date() },
    })

    // Audit: successful login
    await logAuditEvent({
      action: 'user.login_success',
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
      actorEmail: email,
      summary: `User logged in: ${user.displayName}`,
    })

    return mapToPublicRecord(user)
  } catch (error) {
    console.error('Error authenticating user:', error)
    throw error
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<string | null> {
  try {
    const user = (await prisma.user.findUnique({
      where: { email },
    })) as UserDbRecord | null

    if (!user) {
      // Don't reveal if email exists - security best practice
      return null
    }

    const { token: resetToken, expiresAt } = generatePasswordResetToken()

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: expiresAt,
      },
    })

    // Audit: password reset requested
    await logAuditEvent({
      action: 'user.password_reset_requested',
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
      actorEmail: user.email,
      summary: `Password reset requested for ${user.email}`,
    })

    return resetToken
  } catch (error) {
    console.error('Error requesting password reset:', error)
    throw error
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  try {
    const user = (await prisma.user.findUnique({
      where: { resetToken: token },
    })) as UserDbRecord | null

    if (!user || !user.resetTokenExpiry || isTokenExpired(user.resetTokenExpiry)) {
      return false
    }

    const passwordHash = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    // Audit: password changed
    await logAuditEvent({
      action: 'user.password_changed',
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
      actorEmail: user.email,
      summary: `Password reset for ${user.email}`,
    })

    return true
  } catch (error) {
    console.error('Error resetting password:', error)
    throw error
  }
}

/**
 * Change password (user authenticated)
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  try {
    const user = (await prisma.user.findUnique({
      where: { id: userId },
    })) as UserDbRecord | null

    if (!user) return false

    const passwordValid = await verifyPassword(currentPassword, user.passwordHash)
    if (!passwordValid) return false

    const passwordHash = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })

    // Audit: password changed
    await logAuditEvent({
      action: 'user.password_changed',
      entityType: 'User',
      entityId: userId,
      userId: userId,
      actorEmail: user.email,
      summary: `Password changed by user for ${user.email}`,
    })

    return true
  } catch (error) {
    console.error('Error changing password:', error)
    throw error
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  displayName?: string,
  phone?: string
): Promise<PublicUserRecord | null> {
  try {
    const updateData: { displayName?: string; phone?: string | null } = {}
    if (displayName) updateData.displayName = displayName
    if (phone !== undefined) updateData.phone = phone || null

    const user = (await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })) as UserDbRecord

    // Audit: profile updated
    await logAuditEvent({
      action: 'user.profile_updated',
      entityType: 'User',
      entityId: userId,
      userId: userId,
      actorEmail: user.email,
      summary: `Profile updated for ${user.email}`,
    })

    return mapToPublicRecord(user)
  } catch (error: unknown) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

/**
 * List users with optional filtering (admin only)
 * Filters are applied at database level for scalability
 * @param limit - Number of users to return (default: 50)
 * @param offset - Number of users to skip (default: 0)
 * @param filters - Optional filters: search (email/displayName), status (active/inactive), role (member/admin)
 */
export async function listUsers(
  limit: number = 50,
  offset: number = 0,
  filters?: {
    search?: string
    status?: 'active' | 'inactive'
    role?: string
  }
): Promise<{
  users: PublicUserRecord[]
  total: number
}> {
  try {
    // Build Prisma where clause from filters
    const where: Record<string, unknown> = {}

    if (filters?.search) {
      const searchTerm = filters.search.trim().toLowerCase()
      where.OR = [
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { displayName: { contains: searchTerm, mode: 'insensitive' } },
      ] as unknown[]
    }

    if (filters?.status) {
      where.isActive = filters.status === 'active'
    }

    if (filters?.role) {
      where.role = filters.role
    }

    const users = (await prisma.user.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    })) as UserDbRecord[]

    const total = await prisma.user.count({
      where: Object.keys(where).length > 0 ? where : undefined,
    })

    return {
      users: users.map(mapToPublicRecord),
      total,
    }
  } catch (error: unknown) {
    console.error('Error listing users:', error)
    throw error
  }
}

/**
 * Deactivate user (admin only)
 */
export async function deactivateUser(
  userId: string,
  adminEmail: string,
  adminRole: string = 'moderator',
  auditMetadata?: { ipAddress?: string; userAgent?: string }
): Promise<boolean> {
  try {
    const user = (await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    })) as UserDbRecord

    // Audit: user deactivated with full metadata
    await logAuditEvent({
      action: 'user.deactivated',
      entityType: 'User',
      entityId: userId,
      actorEmail: adminEmail,
      actorRole: adminRole,
      summary: `User deactivated: ${user.email}`,
      ipAddress: auditMetadata?.ipAddress,
      userAgent: auditMetadata?.userAgent,
      metadata: {
        userId,
        email: user.email,
        displayName: user.displayName,
        deactivatedAt: new Date().toISOString(),
      },
    })

    return true
  } catch (error: unknown) {
    console.error('Error deactivating user:', error)
    throw error
  }
}

/**
 * Activate user (admin only)
 */
export async function activateUser(
  userId: string,
  adminEmail: string,
  adminRole: string = 'moderator',
  auditMetadata?: { ipAddress?: string; userAgent?: string }
): Promise<boolean> {
  try {
    const user = (await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    })) as UserDbRecord

    // Audit: user activated with full metadata
    await logAuditEvent({
      action: 'user.activated',
      entityType: 'User',
      entityId: userId,
      actorEmail: adminEmail,
      actorRole: adminRole,
      summary: `User activated: ${user.email}`,
      ipAddress: auditMetadata?.ipAddress,
      userAgent: auditMetadata?.userAgent,
      metadata: {
        userId,
        email: user.email,
        displayName: user.displayName,
        activatedAt: new Date().toISOString(),
      },
    })

    return true
  } catch (error: unknown) {
    console.error('Error activating user:', error)
    throw error
  }
}

/**
 * Get user audit logs
 */
export async function getUserAuditLogs(userId: string, limit: number = 50): Promise<PublicUserAuditLogRecord[]> {
  try {
    const logs = (await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })) as UserAuditLogRecord[]

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      summary: log.summary,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      success: log.success,
      createdAt: log.createdAt.toISOString(),
    }))
  } catch (error) {
    console.error('Error fetching user audit logs:', error)
    throw error
  }
}

// ============================================================================
// Private Helpers
// ============================================================================

function mapToPublicRecord(user: UserDbRecord): PublicUserRecord {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

interface AuditEventData {
  action: string
  entityType: string
  entityId?: string
  userId?: string
  actorEmail: string
  actorRole?: string // 'super_admin', 'founder_admin', 'editor', 'moderator', or user-initiated actions
  summary: string
  success?: boolean
  ipAddress?: string // IP address of the actor
  userAgent?: string // User-Agent of the actor
  metadata?: Record<string, unknown> // Structured metadata for investigations
}

async function logAuditEvent({
  action,
  entityType,
  entityId,
  userId,
  actorEmail,
  actorRole = 'moderator', // Default to moderator for user-initiated actions
  summary,
  success = true,
  ipAddress,
  userAgent,
  metadata,
}: AuditEventData): Promise<void> {
  try {
    const serializedMetadata = metadata
      ? JSON.parse(JSON.stringify(metadata))
      : undefined

    const data = {
      action,
      entityType,
      entityId: entityId || undefined,
      userId: userId || undefined,
      actorEmail,
      actorRole: (actorRole === 'super_admin' || actorRole === 'founder_admin' || actorRole === 'editor' || actorRole === 'moderator'
        ? actorRole
        : 'moderator') as 'super_admin' | 'founder_admin' | 'editor' | 'moderator',
      summary,
      success,
      ipAddress,
      userAgent,
      createdAt: new Date(),
    }

    if (serializedMetadata !== undefined) {
      ;(data as Record<string, unknown>).metadata = serializedMetadata
    }

    await prisma.auditLog.create({
      data,
    })
  } catch (error: unknown) {
    console.error('Error logging audit event:', error)
    // Don't throw - audit logging shouldn't block operations
  }
}

/**
 * Generate and send phone verification code for password reset
 */
export async function generatePhoneVerificationCode(email: string, phone: string): Promise<string | null> {
  try {
    const user = (await prisma.user.findUnique({
      where: { email },
    })) as UserDbRecord | null

    if (!user || !user.phone || user.phone !== phone) {
      return null
    }

    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerifyCode: verificationCode,
        phoneVerifyExpiry: expiresAt,
      },
    })

    // Audit: phone verification code generated
    await logAuditEvent({
      action: 'user.phone_verify_requested',
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
      actorEmail: user.email,
      summary: `Phone verification code generated for ${user.email}`,
    })

    // Return code for testing/development (in production, would be sent via SMS)
    return verificationCode
  } catch (error) {
    console.error('Error generating phone verification code:', error)
    throw error
  }
}

/**
 * Verify phone code and proceed with password reset
 */
export async function verifyPhoneCodeAndGenerateReset(
  email: string,
  phone: string,
  code: string
): Promise<string | null> {
  try {
    const user = (await prisma.user.findUnique({
      where: { email },
    })) as UserDbRecord | null

    if (!user) {
      return null
    }

    // Verify phone and code
    if (user.phone !== phone || user.phoneVerifyCode !== code) {
      // Audit: phone verification failed
      await logAuditEvent({
        action: 'user.phone_verify_failed',
        entityType: 'User',
        entityId: user.id,
        userId: user.id,
        actorEmail: user.email,
        summary: `Phone verification failed for ${user.email}`,
        success: false,
      })
      return null
    }

    // Check if code expired
    if (!user.phoneVerifyExpiry || isTokenExpired(user.phoneVerifyExpiry)) {
      return null
    }

    // Generate password reset token
    const { token: resetToken, expiresAt } = generatePasswordResetToken()

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: expiresAt,
        phoneVerifyCode: null,
        phoneVerifyExpiry: null,
      },
    })

    // Audit: phone verification succeeded
    await logAuditEvent({
      action: 'user.phone_verified',
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
      actorEmail: user.email,
      summary: `Phone verified and reset token generated for ${user.email}`,
    })

    return resetToken
  } catch (error) {
    console.error('Error verifying phone code:', error)
    throw error
  }
}

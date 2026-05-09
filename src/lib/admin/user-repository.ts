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
  passwordHash: string
  isActive: boolean
  emailVerified: boolean
  emailVerifyToken: string | null
  resetToken: string | null
  resetTokenExpiry: Date | null
  createdAt: Date
  updatedAt: Date
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
  password: string
): Promise<{ user: PublicUserRecord; verificationToken: string } | null> {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const passwordHash = await hashPassword(password)
    const { token: emailVerifyToken, expiresAt: _expiresAt } =
      generateEmailVerificationToken()

    const user = (await prisma.user.create({
      data: {
        email,
        displayName,
        passwordHash,
        emailVerifyToken,
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

    // Token check happens implicitly - unique constraint ensures one match
    const updatedUser = (await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
      },
    })) as UserDbRecord

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
  displayName: string
): Promise<PublicUserRecord | null> {
  try {
    const user = (await prisma.user.update({
      where: { id: userId },
      data: { displayName },
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
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

/**
 * List all users (admin only)
 */
export async function listUsers(limit: number = 50, offset: number = 0): Promise<{
  users: PublicUserRecord[]
  total: number
}> {
  try {
    const users = (await prisma.user.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    })) as UserDbRecord[]

    const total = await prisma.user.count()

    return {
      users: users.map(mapToPublicRecord),
      total,
    }
  } catch (error) {
    console.error('Error listing users:', error)
    throw error
  }
}

/**
 * Deactivate user (admin only)
 */
export async function deactivateUser(userId: string, adminEmail: string): Promise<boolean> {
  try {
    const user = (await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    })) as UserDbRecord

    // Audit: user deactivated
    await logAuditEvent({
      action: 'user.deactivated',
      entityType: 'User',
      entityId: userId,
      actorEmail: adminEmail,
      summary: `User deactivated: ${user.email}`,
    })

    return true
  } catch (error) {
    console.error('Error deactivating user:', error)
    throw error
  }
}

/**
 * Activate user (admin only)
 */
export async function activateUser(userId: string, adminEmail: string): Promise<boolean> {
  try {
    const user = (await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    })) as UserDbRecord

    // Audit: user activated
    await logAuditEvent({
      action: 'user.activated',
      entityType: 'User',
      entityId: userId,
      actorEmail: adminEmail,
      summary: `User activated: ${user.email}`,
    })

    return true
  } catch (error) {
    console.error('Error activating user:', error)
    throw error
  }
}

/**
 * Get user audit logs
 */
export async function getUserAuditLogs(userId: string, limit: number = 50): Promise<any[]> {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return logs.map((log: any) => ({
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
  summary: string
  success?: boolean
}

async function logAuditEvent({
  action,
  entityType,
  entityId,
  userId,
  actorEmail,
  summary,
  success = true,
}: AuditEventData): Promise<void> {
  try {
    // Determine admin role - for user-initiated actions, use 'moderator'
    const actorRole = userId ? 'moderator' : 'moderator'

    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId: entityId || undefined,
        userId: userId || undefined,
        actorEmail,
        actorRole,
        summary,
        success,
        createdAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Error logging audit event:', error)
    // Don't throw - audit logging shouldn't block operations
  }
}

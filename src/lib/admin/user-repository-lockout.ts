import { prisma } from '@/lib/prisma'

type LockoutUserRecord = {
  id: string
  email: string
  failedLoginAttempts: number
  lockoutUntil: Date | null
}

type LockoutUpdateData = {
  failedLoginAttempts: number
  lockoutUntil?: Date | null
}

async function logUserAuditEvent({
  action,
  entityId,
  userId,
  actorEmail,
  summary,
  success = true,
}: {
  action: string
  entityId: string
  userId: string
  actorEmail: string
  summary: string
  success?: boolean
}) {
  await prisma.auditLog.create({
    data: {
      action,
      entityType: 'User',
      entityId,
      userId,
      actorEmail,
      actorRole: 'moderator',
      summary,
      success,
    },
  })
}

/**
 * Check if account is locked out
 */
export async function checkAccountLockout(userId: string): Promise<{
  locked: boolean
  remainingMs?: number
}> {
  try {
    const user = (await prisma.user.findUnique({
      where: { id: userId },
    })) as LockoutUserRecord | null

    if (!user) {
      return { locked: false }
    }

    const now = new Date()

    // Check if lockout has expired
    if (user.lockoutUntil && user.lockoutUntil > now) {
      const remainingMs = user.lockoutUntil.getTime() - now.getTime()
      return {
        locked: true,
        remainingMs,
      }
    }

    // Lockout expired, clear it
    if (user.lockoutUntil && user.lockoutUntil <= now) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          lockoutUntil: null,
          failedLoginAttempts: 0,
        },
      })
    }

    return { locked: false }
  } catch (error) {
    console.error('Error checking account lockout:', error)
    throw error
  }
}

/**
 * Increment failed login attempts and lock account if necessary
 */
export async function incrementFailedLoginAttempts(userId: string): Promise<{
  attempts: number
  locked: boolean
  lockoutUntilMs?: number
}> {
  try {
    const user = (await prisma.user.findUnique({
      where: { id: userId },
    })) as LockoutUserRecord | null

    if (!user) {
      return { attempts: 0, locked: false }
    }

    const updatedAttempts = user.failedLoginAttempts + 1
    const MAX_ATTEMPTS = 5
    const LOCKOUT_DURATION_MS = 30 * 60 * 1000 // 30 minutes

    const updateData: LockoutUpdateData = {
      failedLoginAttempts: updatedAttempts,
    }

    // Lock account after 5 failed attempts
    if (updatedAttempts >= MAX_ATTEMPTS) {
      const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS)
      updateData.lockoutUntil = lockoutUntil

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      })

      // Audit: account locked
      await logUserAuditEvent({
        action: 'user.account_locked',
        entityId: userId,
        userId: userId,
        actorEmail: user.email,
        summary: `Account locked after ${MAX_ATTEMPTS} failed login attempts`,
      })

      return {
        attempts: updatedAttempts,
        locked: true,
        lockoutUntilMs: LOCKOUT_DURATION_MS,
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    return {
      attempts: updatedAttempts,
      locked: false,
    }
  } catch (error) {
    console.error('Error incrementing failed login attempts:', error)
    throw error
  }
}

/**
 * Reset failed login attempts after successful login
 */
export async function resetFailedLoginAttempts(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    })
  } catch (error) {
    console.error('Error resetting failed login attempts:', error)
    // Don't throw - this is non-critical
  }
}

/**
 * Track code generation attempts (for rate limiting)
 */
export async function trackCodeGeneration(email: string, type: 'phone_verify' | 'password_reset'): Promise<void> {
  try {
    // This is tracked via the rate limiter utility
    // This function is here for potential database tracking in future
    const user = (await prisma.user.findUnique({
      where: { email },
    })) as LockoutUserRecord | null

    if (user) {
      // Could add metadata to AuditLog for code generation tracking
      await logUserAuditEvent({
        action: `user.${type}_requested`,
        entityId: user.id,
        userId: user.id,
        actorEmail: email,
        summary: `${type} code requested for ${email}`,
      })
    }
  } catch (error) {
    console.error('Error tracking code generation:', error)
    // Don't throw - tracking is non-critical
  }
}

/**
 * Temporary Reset Session Manager
 * Securely handles password reset flow without exposing tokens to client
 *
 * Flow:
 * 1. User verifies phone code
 * 2. Server creates temporary reset session -> resetSessionId
 * 3. Return resetSessionId to client (not sensitive)
 * 4. Client includes resetSessionId in reset-password call
 * 5. Server validates session, performs reset, clears session
 *
 * This prevents:
 * - Token exposure in network responses
 * - Token persistence in browser storage (sessionStorage XSS risk)
 * - Token interception and reuse
 */

import crypto from 'crypto'

interface ResetSessionEntry {
  resetToken: string
  userId: string
  expiresAt: number
  used: boolean
}

class ResetSessionManager {
  private store: Map<string, ResetSessionEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Cleanup expired sessions every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Create a new reset session
   * @param resetToken - The actual reset token (sensitive, stays server-side)
   * @param userId - User ID for validation
   * @param ttlMs - Time to live in milliseconds (default 15 minutes)
   * @returns Reset session ID (safe to send to client)
   */
  create(resetToken: string, userId: string, ttlMs: number = 15 * 60 * 1000): string {
    // Generate cryptographically secure session ID
    const sessionId = crypto.randomBytes(32).toString('hex')

    this.store.set(sessionId, {
      resetToken,
      userId,
      expiresAt: Date.now() + ttlMs,
      used: false,
    })

    return sessionId
  }

  /**
   * Validate and retrieve reset token from session
   * @param sessionId - Session ID from client
   * @param userId - User ID to validate against
   * @returns Reset token if valid, null otherwise
   */
  validate(sessionId: string, userId: string): string | null {
    const entry = this.store.get(sessionId)

    if (!entry) {
      return null
    }

    // Check expiry
    if (Date.now() > entry.expiresAt) {
      this.store.delete(sessionId)
      return null
    }

    // Check if already used (prevent reuse)
    if (entry.used) {
      this.store.delete(sessionId)
      return null
    }

    // Validate user ID matches
    if (entry.userId !== userId) {
      return null
    }

    return entry.resetToken
  }

  /**
   * Mark session as used and invalidate it
   * @param sessionId - Session ID to invalidate
   */
  invalidate(sessionId: string): void {
    const entry = this.store.get(sessionId)
    if (entry) {
      entry.used = true
      // Delete immediately after marking used
      this.store.delete(sessionId)
    }
  }

  /**
   * Cleanup expired sessions
   */
  private cleanup(): void {
    const now = Date.now()

    for (const [sessionId, entry] of this.store.entries()) {
      if (now > entry.expiresAt || entry.used) {
        this.store.delete(sessionId)
      }
    }
  }

  /**
   * Destroy manager and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// Singleton instance
let instance: ResetSessionManager | null = null

export function getResetSessionManager(): ResetSessionManager {
  if (!instance) {
    instance = new ResetSessionManager()
  }
  return instance
}

/**
 * Destroy the reset session manager
 */
export function destroyResetSessionManager(): void {
  if (instance) {
    instance.destroy()
    instance = null
  }
}

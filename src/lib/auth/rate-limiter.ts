/**
 * In-memory rate limiter for authentication endpoints
 * Tracks requests by key (email, IP, etc.) and enforces limits
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Cleanup old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Check if request is allowed
   * @param key - Identifier (email, IP, etc.)
   * @param limit - Max allowed requests
   * @param windowMs - Time window in milliseconds
   * @returns Object with allowed status and details
   */
  isAllowed(
    key: string,
    limit: number,
    windowMs: number
  ): {
    allowed: boolean
    remaining: number
    retryAfterMs: number | null
  } {
    const now = Date.now()
    const entry = this.store.get(key)

    // No entry exists, create new one
    if (!entry) {
      this.store.set(key, {
        count: 1,
        resetAt: now + windowMs,
      })
      return {
        allowed: true,
        remaining: limit - 1,
        retryAfterMs: null,
      }
    }

    // Window expired, reset
    if (now >= entry.resetAt) {
      this.store.set(key, {
        count: 1,
        resetAt: now + windowMs,
      })
      return {
        allowed: true,
        remaining: limit - 1,
        retryAfterMs: null,
      }
    }

    // Within window, increment count
    entry.count++

    const allowed = entry.count <= limit
    const remaining = Math.max(0, limit - entry.count)
    const retryAfterMs = allowed ? null : entry.resetAt - now

    return {
      allowed,
      remaining,
      retryAfterMs,
    }
  }

  /**
   * Reset counter for a specific key
   */
  reset(key: string): void {
    this.store.delete(key)
  }

  /**
   * Get current count for a key
   */
  getCount(key: string): number {
    const entry = this.store.get(key)
    if (!entry) return 0

    const now = Date.now()
    if (now >= entry.resetAt) {
      this.store.delete(key)
      return 0
    }

    return entry.count
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetAt) {
        this.store.delete(key)
      }
    }
  }

  /**
   * Destroy the limiter (cleanup interval)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// Create singleton instance
let instance: RateLimiter | null = null

export function getRateLimiter(): RateLimiter {
  if (!instance) {
    instance = new RateLimiter()
  }
  return instance
}

/**
 * Rate limiter configuration for different endpoints
 */
export const RATE_LIMIT_CONFIG = {
  // Login: 5 attempts per 15 minutes
  login: {
    limit: 5,
    windowMs: 15 * 60 * 1000,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  // Register: 3 attempts per hour
  register: {
    limit: 3,
    windowMs: 60 * 60 * 1000,
    message: 'Too many registration attempts. Please try again later.',
  },
  // Phone verification code request: 5 attempts per hour
  phoneVerification: {
    limit: 5,
    windowMs: 60 * 60 * 1000,
    message: 'Too many verification code requests. Please try again later.',
  },
  // Verification code entry: 10 attempts per 15 minutes
  verifyCode: {
    limit: 10,
    windowMs: 15 * 60 * 1000,
    message: 'Too many failed verification attempts. Please try again later.',
  },
}

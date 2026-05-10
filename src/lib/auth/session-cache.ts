/**
 * In-memory session cache with TTL
 * Reduces database hits by caching session validation results for short periods
 * This is per-process, used within a single request lifecycle
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

// Session validation cache: userId -> validated user data + activity timestamp
const sessionCache = new Map<string, CacheEntry<{ data: unknown; activityCheck: number }>>()

// Cache TTL: 1 second (very short to catch rapid consecutive requests)
const CACHE_TTL_MS = 1000

/**
 * Get cached session if still valid
 */
export function getCachedSession(
  userId: string
): { data: unknown; activityCheck: number } | null {
  const entry = sessionCache.get(userId)

  if (!entry) {
    return null
  }

  if (Date.now() > entry.expiresAt) {
    sessionCache.delete(userId)
    return null
  }

  return entry.data
}

/**
 * Set session in cache
 */
export function setCachedSession(
  userId: string,
  data: { data: unknown; activityCheck: number }
): void {
  sessionCache.set(userId, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })

  // Prevent unbounded cache growth - clean up old entries periodically
  if (sessionCache.size > 10000) {
    const now = Date.now()
    for (const [key, entry] of sessionCache.entries()) {
      if (now > entry.expiresAt) {
        sessionCache.delete(key)
      }
    }
  }
}

/**
 * Clear all session cache (use on logout or config change)
 */
export function clearSessionCache(): void {
  sessionCache.clear()
}

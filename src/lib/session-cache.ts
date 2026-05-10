/**
 * Session Cache
 * In-memory cache for session data with TTL
 * Reduces database queries and improves performance
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export type SessionCacheValue = Record<string, unknown>

export class SessionCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map()
  private ttlMs: number
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(ttlMs: number = 10 * 1000) {
    // Default 10 second TTL
    this.ttlMs = ttlMs

    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60 * 1000)
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    })
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  /**
   * Check if key exists in cache and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Delete key from cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Destroy cache and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
  }
}

/**
 * Global session cache instance (5 second TTL by default)
 */
let sessionCacheInstance: SessionCache<SessionCacheValue> | null = null

export function getSessionCache(): SessionCache<SessionCacheValue> {
  if (!sessionCacheInstance) {
    sessionCacheInstance = new SessionCache<SessionCacheValue>(5 * 1000)
  }
  return sessionCacheInstance
}

/**
 * Destroy global session cache
 */
export function destroySessionCache(): void {
  if (sessionCacheInstance) {
    sessionCacheInstance.destroy()
    sessionCacheInstance = null
  }
}

/**
 * Cache strategy wrapper
 */
export async function cacheOrFetch<T>(
  cache: SessionCache<T>,
  key: string,
  fetcher: () => Promise<T | null>
): Promise<T | null> {
  // Try cache first
  const cached = cache.get(key)
  if (cached !== null) {
    return cached
  }

  // Fetch from source
  const value = await fetcher()

  // Cache if not null
  if (value !== null) {
    cache.set(key, value)
  }

  return value
}

/**
 * Batch cache utility - cache multiple related sessions
 */
export async function cacheBatchFetch<T>(
  cache: SessionCache<T>,
  keys: string[],
  fetcher: (missingKeys: string[]) => Promise<Map<string, T>>,
  maxBatchSize: number = 100
): Promise<Map<string, T>> {
  const results = new Map<string, T>()
  const missingKeys: string[] = []

  // Check cache for existing keys
  for (const key of keys) {
    const cached = cache.get(key)
    if (cached !== null) {
      results.set(key, cached)
    } else {
      missingKeys.push(key)
    }
  }

  // Fetch missing keys in batches
  if (missingKeys.length > 0) {
    const batches = []
    for (let i = 0; i < missingKeys.length; i += maxBatchSize) {
      batches.push(missingKeys.slice(i, i + maxBatchSize))
    }

    for (const batch of batches) {
      const fetched = await fetcher(batch)

      // Cache and add to results
      for (const [key, value] of fetched.entries()) {
        cache.set(key, value)
        results.set(key, value)
      }
    }
  }

  return results
}

/**
 * In-memory sliding-window rate limiter for Next.js API routes.
 *
 * Each limiter instance maintains a Map keyed by client identifier (typically
 * IP address) whose values are sorted arrays of request timestamps.  On every
 * call, timestamps older than `windowMs` are pruned before the count is
 * checked, keeping memory bounded.
 *
 * NOTE: This implementation is intentionally single-process.  If the app is
 * ever deployed behind multiple Node.js replicas (e.g. Kubernetes pods), swap
 * this for a Redis-backed counter such as `@upstash/ratelimit`.
 */

export interface RateLimitOptions {
  /** Rolling window duration in milliseconds. */
  windowMs: number
  /** Maximum number of requests allowed within the window. */
  limit: number
}

export interface RateLimitResult {
  /** True when the request should be blocked. */
  limited: boolean
  /** Remaining requests allowed in the current window. */
  remaining: number
  /** Unix timestamp (ms) at which the oldest recorded request expires. */
  resetAt: number
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, limit } = options
  const store = new Map<string, number[]>()

  return function check(identifier: string): RateLimitResult {
    const now = Date.now()
    const windowStart = now - windowMs

    // Prune stale timestamps.
    const timestamps = (store.get(identifier) ?? []).filter((t) => t > windowStart)

    const resetAt = timestamps.length > 0 ? timestamps[0] + windowMs : now + windowMs

    if (timestamps.length >= limit) {
      return { limited: true, remaining: 0, resetAt }
    }

    timestamps.push(now)
    store.set(identifier, timestamps)

    return { limited: false, remaining: limit - timestamps.length, resetAt }
  }
}

/** Extracts the best available client IP from a Next.js request. */
export function getClientIp(request: Request): string {
  // Vercel / Cloudflare / most reverse proxies set one of these.
  const forwarded =
    (request.headers as Headers).get('x-real-ip') ??
    (request.headers as Headers).get('x-forwarded-for')?.split(',')[0].trim()

  return forwarded ?? 'unknown'
}

// ---------------------------------------------------------------------------
// Shared limiters — one instance per endpoint family so limits are enforced
// independently.  Adjust numbers here to tune capacity.
// ---------------------------------------------------------------------------

/** 5 contact-booking submissions per IP per 10 minutes. */
export const contactLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, limit: 5 })

/** 10 vault question submissions per IP per 10 minutes. */
export const vaultLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, limit: 10 })

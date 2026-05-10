/**
 * Security Utilities
 * CSRF tokens, input sanitization, and XSS prevention
 */

import crypto from 'crypto'

type SanitizableObject = Record<string, unknown>

function isPlainObject(value: unknown): value is SanitizableObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Generate CSRF token for session
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string, storedToken: string): boolean {
  try {
    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(storedToken))
  } catch {
    return false
  }
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    .replace(/[<>]/g, (char) => {
      return char === '<' ? '&lt;' : '&gt;'
    })
    .slice(0, 1000) // Limit length
}

/**
 * Sanitize object keys to prevent injection
 */
export function sanitizeObjectKeys<T extends SanitizableObject>(obj: T): T {
  const sanitized: SanitizableObject = {}

  for (const [key, value] of Object.entries(obj)) {
    // Only allow alphanumeric, underscore, and hyphen in keys
    if (/^[a-zA-Z0-9_-]+$/.test(key)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value)
      } else if (isPlainObject(value)) {
        sanitized[key] = sanitizeObjectKeys(value)
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === 'string' ? sanitizeInput(item) : item
        )
      } else {
        sanitized[key] = value
      }
    }
  }

  return sanitized as T
}

/**
 * Check if value could be a potential attack vector
 */
export function isNullOrUndefinedOrEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === ''
}

/**
 * Rate limit bypass prevention - generate secure key
 * Combines user identifier and IP for better tracking
 */
export function generateRateLimitKey(
  type: string,
  userId: string | null,
  ip: string,
  email?: string
): string {
  const components = [type]

  if (userId) {
    components.push(`user-${userId}`)
  }

  if (email) {
    components.push(`email-${email.toLowerCase()}`)
  }

  components.push(`ip-${ip}`)

  return components.join(':')
}

/**
 * Hash IP address for privacy
 */
export function hashIP(ip: string, salt: string = process.env.IP_HASH_SALT || ''): string {
  return crypto
    .createHash('sha256')
    .update(ip + salt)
    .digest('hex')
    .slice(0, 16)
}

/**
 * Generate secure random string
 */
export function generateSecureString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Constant-time string comparison
 */
export function constantTimeCompare(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}

/**
 * Response security headers
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

/**
 * Validate and extract client IP from request
 */
export function extractClientIP(headers: Record<string, string | string[] | undefined>): string {
  const forwarded = headers['x-forwarded-for']
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded
  if (forwardedValue) {
    return forwardedValue.split(',')[0].trim()
  }

  const realIP = headers['x-real-ip']
  if (Array.isArray(realIP)) {
    return realIP[0] ?? 'unknown'
  }

  if (realIP) {
    return realIP
  }

  return 'unknown'
}

/**
 * Check if user agent indicates a bot
 */
export function isBot(userAgent: string): boolean {
  const botPatterns = [
    'bot',
    'crawler',
    'spider',
    'scraper',
    'curl',
    'wget',
    'python',
    'java',
    'scanner',
  ]

  const lowerUA = userAgent.toLowerCase()
  return botPatterns.some((pattern) => lowerUA.includes(pattern))
}

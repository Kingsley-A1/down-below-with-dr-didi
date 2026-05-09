import { randomBytes } from 'crypto'

/**
 * Generate a secure random token
 * @param length Number of bytes (will be hex-encoded, resulting in 2x length string)
 * @returns Hex-encoded token string
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

/**
 * Generate an email verification token
 * Token: 32-char random string with 24h expiry
 */
export function generateEmailVerificationToken(): {
  token: string
  expiresAt: Date
} {
  return {
    token: generateToken(32),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  }
}

/**
 * Generate a password reset token
 * Token: 32-char random string with 1h expiry
 */
export function generatePasswordResetToken(): {
  token: string
  expiresAt: Date
} {
  return {
    token: generateToken(32),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  }
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true
  return new Date() > expiresAt
}

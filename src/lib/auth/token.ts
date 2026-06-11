import { randomBytes, randomInt } from 'crypto'

/** Email verification codes live for one hour from issue. */
export const EMAIL_VERIFICATION_CODE_TTL_MS = 60 * 60 * 1000

/** Number of decimal digits in an email verification code. */
export const EMAIL_VERIFICATION_CODE_LENGTH = 6

/**
 * Generate a secure random token
 * @param length Number of bytes (will be hex-encoded, resulting in 2x length string)
 * @returns Hex-encoded token string
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

/**
 * Generate an email verification code.
 *
 * A cryptographically-random 6-digit code (zero-padded, e.g. "042913") with a
 * 1-hour expiry. Codes are emailed to the registrant, who types them into the
 * verify-email screen. They are scoped to an account by email, so they are
 * intentionally short and not globally unique.
 */
export function generateEmailVerificationCode(): {
  code: string
  expiresAt: Date
} {
  const max = 10 ** EMAIL_VERIFICATION_CODE_LENGTH
  const code = String(randomInt(0, max)).padStart(EMAIL_VERIFICATION_CODE_LENGTH, '0')
  return {
    code,
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_CODE_TTL_MS),
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

import { describe, expect, it } from '@jest/globals'
import {
  EMAIL_VERIFICATION_CODE_LENGTH,
  EMAIL_VERIFICATION_CODE_TTL_MS,
  generateEmailVerificationCode,
} from '@/lib/auth/token'

describe('generateEmailVerificationCode', () => {
  it('returns a zero-preserving 6-digit code with a one-hour expiry', () => {
    const before = Date.now()
    const result = generateEmailVerificationCode()
    const after = Date.now()

    expect(result.code).toMatch(/^\d{6}$/)
    expect(result.code).toHaveLength(EMAIL_VERIFICATION_CODE_LENGTH)
    expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + EMAIL_VERIFICATION_CODE_TTL_MS
    )
    expect(result.expiresAt.getTime()).toBeLessThanOrEqual(
      after + EMAIL_VERIFICATION_CODE_TTL_MS
    )
  })
})

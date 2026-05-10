/**
 * Rate Limiting Tests
 * Tests for rate limiter utility
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { getRateLimiter, RATE_LIMIT_CONFIG } from '@/lib/auth/rate-limiter'

describe('Rate Limiter', () => {
  let limiter: ReturnType<typeof getRateLimiter>

  beforeEach(() => {
    limiter = getRateLimiter()
    // Reset for each test
    limiter.destroy()
    limiter = getRateLimiter()
  })

  afterEach(() => {
    limiter.destroy()
  })

  describe('Login Rate Limiting', () => {
    it('should allow first 5 login attempts', () => {
      for (let i = 0; i < 5; i++) {
        const result = limiter.isAllowed(
          'test@example.com',
          RATE_LIMIT_CONFIG.login.limit,
          RATE_LIMIT_CONFIG.login.windowMs
        )
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(4 - i)
      }
    })

    it('should block 6th login attempt', () => {
      for (let i = 0; i < 5; i++) {
        limiter.isAllowed(
          'test@example.com',
          RATE_LIMIT_CONFIG.login.limit,
          RATE_LIMIT_CONFIG.login.windowMs
        )
      }

      const result = limiter.isAllowed(
        'test@example.com',
        RATE_LIMIT_CONFIG.login.limit,
        RATE_LIMIT_CONFIG.login.windowMs
      )
      expect(result.allowed).toBe(false)
      expect(result.retryAfterMs).toBeGreaterThan(0)
    })

    it('should reset counter after reset call', () => {
      for (let i = 0; i < 5; i++) {
        limiter.isAllowed(
          'test@example.com',
          RATE_LIMIT_CONFIG.login.limit,
          RATE_LIMIT_CONFIG.login.windowMs
        )
      }

      limiter.reset('test@example.com')

      const result = limiter.isAllowed(
        'test@example.com',
        RATE_LIMIT_CONFIG.login.limit,
        RATE_LIMIT_CONFIG.login.windowMs
      )
      expect(result.allowed).toBe(true)
    })

    it('should track different users separately', () => {
      for (let i = 0; i < 5; i++) {
        limiter.isAllowed(
          'user1@example.com',
          RATE_LIMIT_CONFIG.login.limit,
          RATE_LIMIT_CONFIG.login.windowMs
        )
      }

      // User 2 should have fresh limit
      const result = limiter.isAllowed(
        'user2@example.com',
        RATE_LIMIT_CONFIG.login.limit,
        RATE_LIMIT_CONFIG.login.windowMs
      )
      expect(result.allowed).toBe(true)
    })
  })

  describe('Register Rate Limiting', () => {
    it('should allow first 3 registration attempts', () => {
      for (let i = 0; i < 3; i++) {
        const result = limiter.isAllowed(
          'register-ip-192.168.1.1',
          RATE_LIMIT_CONFIG.register.limit,
          RATE_LIMIT_CONFIG.register.windowMs
        )
        expect(result.allowed).toBe(true)
      }
    })

    it('should block 4th registration attempt', () => {
      for (let i = 0; i < 3; i++) {
        limiter.isAllowed(
          'register-ip-192.168.1.1',
          RATE_LIMIT_CONFIG.register.limit,
          RATE_LIMIT_CONFIG.register.windowMs
        )
      }

      const result = limiter.isAllowed(
        'register-ip-192.168.1.1',
        RATE_LIMIT_CONFIG.register.limit,
        RATE_LIMIT_CONFIG.register.windowMs
      )
      expect(result.allowed).toBe(false)
    })
  })

  describe('Phone Verification Rate Limiting', () => {
    it('should allow phone verification code requests', () => {
      const result = limiter.isAllowed(
        'phone-verify-user@example.com',
        RATE_LIMIT_CONFIG.phoneVerification.limit,
        RATE_LIMIT_CONFIG.phoneVerification.windowMs
      )
      expect(result.allowed).toBe(true)
    })

    it('should track multiple users separately', () => {
      for (let i = 0; i < 3; i++) {
        limiter.isAllowed(
          'phone-verify-user1@example.com',
          RATE_LIMIT_CONFIG.phoneVerification.limit,
          RATE_LIMIT_CONFIG.phoneVerification.windowMs
        )
        limiter.isAllowed(
          'phone-verify-user2@example.com',
          RATE_LIMIT_CONFIG.phoneVerification.limit,
          RATE_LIMIT_CONFIG.phoneVerification.windowMs
        )
      }

      // Both users should still have attempts left
      const result1 = limiter.isAllowed(
        'phone-verify-user1@example.com',
        RATE_LIMIT_CONFIG.phoneVerification.limit,
        RATE_LIMIT_CONFIG.phoneVerification.windowMs
      )
      const result2 = limiter.isAllowed(
        'phone-verify-user2@example.com',
        RATE_LIMIT_CONFIG.phoneVerification.limit,
        RATE_LIMIT_CONFIG.phoneVerification.windowMs
      )

      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
    })
  })

  describe('getCount', () => {
    it('should return correct count', () => {
      limiter.isAllowed('test-count', 5, 60000)
      limiter.isAllowed('test-count', 5, 60000)

      const count = limiter.getCount('test-count')
      expect(count).toBe(2)
    })

    it('should return 0 for unknown key', () => {
      const count = limiter.getCount('unknown-key')
      expect(count).toBe(0)
    })
  })
})

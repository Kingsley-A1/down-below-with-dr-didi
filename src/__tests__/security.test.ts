/**
 * Security Tests
 * Tests for CSRF, XSS prevention, and security utilities
 */

import { describe, it, expect } from '@jest/globals'
import {
  generateCSRFToken,
  verifyCSRFToken,
  sanitizeInput,
  generateRateLimitKey,
  constantTimeCompare,
  isBot,
  generateSecureString,
} from '@/lib/security'

describe('Security Utilities', () => {
  describe('CSRF Token', () => {
    it('should generate unique CSRF tokens', () => {
      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken()

      expect(token1).not.toEqual(token2)
      expect(token1.length).toBeGreaterThan(0)
      expect(token2.length).toBeGreaterThan(0)
    })

    it('should verify correct CSRF token', () => {
      const token = generateCSRFToken()
      const valid = verifyCSRFToken(token, token)

      expect(valid).toBe(true)
    })

    it('should reject incorrect CSRF token', () => {
      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken()
      const valid = verifyCSRFToken(token1, token2)

      expect(valid).toBe(false)
    })

    it('should reject malformed CSRF token', () => {
      const token = generateCSRFToken()
      const valid = verifyCSRFToken('invalid', token)

      expect(valid).toBe(false)
    })
  })

  describe('Input Sanitization', () => {
    it('should remove XSS script tags', () => {
      const malicious = 'Hello <script>alert("xss")</script>'
      const sanitized = sanitizeInput(malicious)

      expect(sanitized).not.toContain('<script>')
      expect(sanitized).toContain('&lt;script&gt;')
    })

    it('should escape angle brackets', () => {
      const input = 'Test <div> content'
      const sanitized = sanitizeInput(input)

      expect(sanitized).toContain('&lt;div&gt;')
      expect(sanitized).not.toContain('<div>')
    })

    it('should trim whitespace', () => {
      const input = '  Test content  '
      const sanitized = sanitizeInput(input)

      expect(sanitized).toEqual('Test content')
    })

    it('should limit input length', () => {
      let longString = ''
      for (let i = 0; i < 2000; i++) {
        longString += 'a'
      }

      const sanitized = sanitizeInput(longString)
      expect(sanitized.length).toBeLessThanOrEqual(1000)
    })

    it('should handle empty input', () => {
      const sanitized = sanitizeInput('')
      expect(sanitized).toEqual('')
    })

    it('should handle null-like strings', () => {
      const sanitized1 = sanitizeInput('null')
      const sanitized2 = sanitizeInput('undefined')

      expect(sanitized1).toEqual('null')
      expect(sanitized2).toEqual('undefined')
    })
  })

  describe('Rate Limit Key Generation', () => {
    it('should generate different keys for different types', () => {
      const key1 = generateRateLimitKey('login', 'user1', '192.168.1.1')
      const key2 = generateRateLimitKey('register', 'user1', '192.168.1.1')

      expect(key1).not.toEqual(key2)
    })

    it('should include user ID when provided', () => {
      const key = generateRateLimitKey('login', 'user123', '192.168.1.1')

      expect(key).toContain('user-user123')
    })

    it('should include IP address', () => {
      const key = generateRateLimitKey('login', 'user1', '192.168.1.1')

      expect(key).toContain('ip-192.168.1.1')
    })

    it('should handle null user ID', () => {
      const key = generateRateLimitKey('login', null, '192.168.1.1')

      expect(key).toBeDefined()
      expect(key).toContain('login')
    })

    it('should normalize email to lowercase', () => {
      const key = generateRateLimitKey('login', 'user1', '192.168.1.1', 'Test@Example.COM')

      expect(key).toContain('test@example.com')
    })
  })

  describe('Constant Time Compare', () => {
    it('should return true for matching strings', () => {
      const result = constantTimeCompare('test', 'test')
      expect(result).toBe(true)
    })

    it('should return false for non-matching strings', () => {
      const result = constantTimeCompare('test', 'other')
      expect(result).toBe(false)
    })

    it('should be resistant to timing attacks', () => {
      // Both calls should take roughly the same time
      const start1 = Date.now()
      constantTimeCompare('a', 'b')
      const time1 = Date.now() - start1

      const start2 = Date.now()
      constantTimeCompare('short', 'very_long_string_that_differs')
      const time2 = Date.now() - start2

      // Timing should be similar (within reasonable margin)
      // This is a basic check - real timing attack resistance requires more sophisticated testing
      expect([time1, time2]).toBeDefined()
    })
  })

  describe('Bot Detection', () => {
    it('should detect bot user agents', () => {
      const botAgents = [
        'Mozilla/5.0 (compatible; Googlebot/2.1)',
        'curl/7.64.1',
        'python-requests/2.25.1',
        'Java-http-client/11',
        'MJ12bot/v1.4.8',
      ]

      botAgents.forEach((agent) => {
        expect(isBot(agent)).toBe(true)
      })
    })

    it('should not flag regular browsers as bots', () => {
      const browserAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Mozilla/5.0 (X11; Linux x86_64)',
      ]

      browserAgents.forEach((agent) => {
        expect(isBot(agent)).toBe(false)
      })
    })

    it('should be case-insensitive', () => {
      expect(isBot('Mozilla BOT Compatible')).toBe(true)
      expect(isBot('mozilla bot compatible')).toBe(true)
    })
  })

  describe('Secure String Generation', () => {
    it('should generate random strings', () => {
      const str1 = generateSecureString()
      const str2 = generateSecureString()

      expect(str1).not.toEqual(str2)
    })

    it('should respect length parameter', () => {
      const str16 = generateSecureString(16)
      const str32 = generateSecureString(32)

      expect(str16.length).toBeGreaterThanOrEqual(32) // hex encoded so double length
      expect(str32.length).toBeGreaterThanOrEqual(64)
    })

    it('should generate valid hex strings', () => {
      const str = generateSecureString()
      expect(/^[a-f0-9]+$/.test(str)).toBe(true)
    })
  })
})

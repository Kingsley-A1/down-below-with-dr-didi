/**
 * Auth Flow Tests
 * Tests for registration, login, email verification, password reset
 */

import { describe, it, expect } from '@jest/globals'
import { userRegisterSchema, userLoginSchema, userPhoneVerificationSchema } from '@/lib/validations'

describe('Auth Validation Schemas', () => {
  describe('userRegisterSchema', () => {
    it('should accept valid registration data', () => {
      const data = {
        email: 'test@example.com',
        displayName: 'Test User',
        phone: '+2348012345678',
        password: 'Test@Password123',
        confirmPassword: 'Test@Password123',
      }
      const result = userRegisterSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept registration without phone', () => {
      const data = {
        email: 'test@example.com',
        displayName: 'Test User',
        password: 'Test@Password123',
        confirmPassword: 'Test@Password123',
      }
      const result = userRegisterSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const data = {
        email: 'invalid-email',
        displayName: 'Test User',
        password: 'Test@Password123',
        confirmPassword: 'Test@Password123',
      }
      const result = userRegisterSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject weak password', () => {
      const data = {
        email: 'test@example.com',
        displayName: 'Test User',
        password: 'weak',
        confirmPassword: 'weak',
      }
      const result = userRegisterSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject non-matching passwords', () => {
      const data = {
        email: 'test@example.com',
        displayName: 'Test User',
        password: 'Test@Password123',
        confirmPassword: 'Test@Password124',
      }
      const result = userRegisterSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject invalid phone format', () => {
      const data = {
        email: 'test@example.com',
        displayName: 'Test User',
        phone: 'invalid-phone',
        password: 'Test@Password123',
        confirmPassword: 'Test@Password123',
      }
      const result = userRegisterSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('userLoginSchema', () => {
    it('should accept valid login data', () => {
      const data = {
        email: 'test@example.com',
        password: 'Test@Password123',
      }
      const result = userLoginSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject missing password', () => {
      const data = {
        email: 'test@example.com',
      }
      const result = userLoginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject missing email', () => {
      const data = {
        password: 'Test@Password123',
      }
      const result = userLoginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('userPhoneVerificationSchema', () => {
    it('should accept valid phone verification data', () => {
      const data = {
        email: 'test@example.com',
        phone: '+2348012345678',
      }
      const result = userPhoneVerificationSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept Nigerian phone with 0 prefix', () => {
      const data = {
        email: 'test@example.com',
        phone: '08012345678',
      }
      const result = userPhoneVerificationSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid phone', () => {
      const data = {
        email: 'test@example.com',
        phone: 'invalid',
      }
      const result = userPhoneVerificationSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })
})

describe('Password Validation', () => {
  it('should validate password strength requirements', () => {
    // Test all requirements
    const validPasswords = [
      'Test@Password123',
      'MyP@ssw0rd!',
      'C0mpl3x#P@ss',
    ]

    const invalidPasswords = [
      'short', // Too short, no special chars
      'NoNumbers@', // No digit
      'nouppercase@123', // No uppercase
      'NOLOWERCASE@123', // No lowercase
      'NoSpecial123', // No special character
    ]

    validPasswords.forEach(pwd => {
      expect(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,128}$/.test(pwd)).toBe(true)
    })

    invalidPasswords.forEach(pwd => {
      expect(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,128}$/.test(pwd)).toBe(false)
    })
  })
})

describe('Email Format Validation', () => {
  it('should accept valid email formats', () => {
    const validEmails = [
      'user@example.com',
      'john.doe@company.co.uk',
      'test+tag@domain.com',
    ]

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    validEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(true)
    })
  })

  it('should reject invalid email formats', () => {
    const invalidEmails = [
      'invalid@',
      '@example.com',
      'no-at-sign.com',
      'spaces in@email.com',
    ]

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    invalidEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(false)
    })
  })
})

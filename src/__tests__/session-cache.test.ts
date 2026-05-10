/**
 * Session Cache Tests
 * Tests for session caching functionality
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { SessionCache, cacheOrFetch } from '@/lib/session-cache'

describe('Session Cache', () => {
  let cache: SessionCache<unknown>

  beforeEach(() => {
    cache = new SessionCache(100) // 100ms TTL for quick tests
  })

  afterEach(() => {
    cache.destroy()
  })

  describe('Basic Operations', () => {
    it('should set and get value', () => {
      const testData = { userId: '123', email: 'test@example.com' }
      cache.set('key1', testData)

      const retrieved = cache.get('key1')
      expect(retrieved).toEqual(testData)
    })

    it('should return null for non-existent key', () => {
      const retrieved = cache.get('non-existent')
      expect(retrieved).toBeNull()
    })

    it('should delete value', () => {
      cache.set('key1', { data: 'test' })
      expect(cache.has('key1')).toBe(true)

      cache.delete('key1')
      expect(cache.has('key1')).toBe(false)
    })

    it('should check key existence', () => {
      cache.set('key1', { data: 'test' })
      expect(cache.has('key1')).toBe(true)
      expect(cache.has('key2')).toBe(false)
    })

    it('should report cache size', () => {
      cache.set('key1', { data: 1 })
      cache.set('key2', { data: 2 })
      cache.set('key3', { data: 3 })

      expect(cache.size()).toBe(3)
    })

    it('should clear all values', () => {
      cache.set('key1', { data: 1 })
      cache.set('key2', { data: 2 })

      cache.clear()

      expect(cache.size()).toBe(0)
      expect(cache.get('key1')).toBeNull()
    })
  })

  describe('TTL Expiration', () => {
    it('should expire old values', async () => {
      const cacheWithShortTTL = new SessionCache(50) // 50ms TTL

      cacheWithShortTTL.set('key1', { data: 'test' })
      expect(cacheWithShortTTL.get('key1')).not.toBeNull()

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(cacheWithShortTTL.get('key1')).toBeNull()

      cacheWithShortTTL.destroy()
    })

    it('should not expire recent values', async () => {
      const cacheWithLongTTL = new SessionCache(1000) // 1 second TTL

      cacheWithLongTTL.set('key1', { data: 'test' })

      // Wait a bit but not long enough for expiration
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(cacheWithLongTTL.get('key1')).not.toBeNull()

      cacheWithLongTTL.destroy()
    })
  })

  describe('Multiple Keys', () => {
    it('should handle multiple keys independently', () => {
      cache.set('user1', { id: 1, name: 'User 1' })
      cache.set('user2', { id: 2, name: 'User 2' })
      cache.set('session1', { token: 'abc123' })

      expect(cache.get('user1')).toEqual({ id: 1, name: 'User 1' })
      expect(cache.get('user2')).toEqual({ id: 2, name: 'User 2' })
      expect(cache.get('session1')).toEqual({ token: 'abc123' })
    })

    it('should delete specific key without affecting others', () => {
      cache.set('key1', { data: 1 })
      cache.set('key2', { data: 2 })

      cache.delete('key1')

      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).not.toBeNull()
    })
  })

  describe('Cache Fetch Strategy', () => {
    it('should return cached value without fetching', async () => {
      cache.set('user-123', { id: '123', name: 'Test User' })

      let fetchCalled = false
      const result = await cacheOrFetch(cache, 'user-123', async () => {
        fetchCalled = true
        return { id: '999', name: 'Different' }
      })

      expect(fetchCalled).toBe(false)
      expect(result).toEqual({ id: '123', name: 'Test User' })
    })

    it('should fetch and cache when not in cache', async () => {
      let fetchCalled = false
      const fetchedData = { id: '456', name: 'Fetched User' }

      const result = await cacheOrFetch(cache, 'user-456', async () => {
        fetchCalled = true
        return fetchedData
      })

      expect(fetchCalled).toBe(true)
      expect(result).toEqual(fetchedData)

      // Verify it's in cache now
      const fromCache = cache.get('user-456')
      expect(fromCache).toEqual(fetchedData)
    })

    it('should not cache null values', async () => {
      const result = await cacheOrFetch(cache, 'not-found', async () => {
        return null
      })

      expect(result).toBeNull()
      expect(cache.has('not-found')).toBe(false)
    })
  })

  describe('Complex Objects', () => {
    it('should handle complex nested objects', () => {
      const complexData = {
        user: {
          id: '123',
          profile: {
            name: 'John Doe',
            email: 'john@example.com',
            settings: {
              notifications: true,
              theme: 'dark',
            },
          },
        },
        metadata: {
          created: '2024-01-01',
          updated: '2024-01-02',
        },
      }

      cache.set('complex', complexData)
      const retrieved = cache.get('complex') as typeof complexData | null

      expect(retrieved).toEqual(complexData)
      expect(retrieved?.user.profile.settings.theme).toEqual('dark')
    })

    it('should handle arrays in cache', () => {
      const arrayData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ]

      cache.set('items', arrayData)
      const retrieved = cache.get('items') as typeof arrayData | null

      expect(Array.isArray(retrieved)).toBe(true)
      expect(retrieved).toHaveLength(3)
      expect(retrieved?.[0].name).toEqual('Item 1')
    })
  })
})

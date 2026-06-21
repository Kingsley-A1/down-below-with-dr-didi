import { describe, expect, it } from '@jest/globals'
import { NextRequest } from 'next/server'
import { parseApiError, readJsonResponse } from '@/lib/api/client-error'
import { resolveRequestId } from '@/lib/api/observability'
import { getAdminStatusTone } from '@/components/admin/adminStatusTone'

describe('API observability helpers', () => {
  it('keeps a generated request ID stable for the same request object', () => {
    const request = new NextRequest('https://www.down-below.test/api/admin/reviews')

    const first = resolveRequestId(request)
    const second = resolveRequestId(request)

    expect(second).toBe(first)
    expect(first).toMatch(/^[A-Za-z0-9._:-]+$/)
  })

  it('uses valid incoming request IDs and rejects unsafe ones', () => {
    const validRequest = new NextRequest('https://www.down-below.test/api/admin/reviews', {
      headers: { 'x-request-id': 'req-safe_123:abc' },
    })
    const unsafeRequest = new NextRequest('https://www.down-below.test/api/admin/reviews', {
      headers: { 'x-request-id': 'not safe request id' },
    })

    expect(resolveRequestId(validRequest)).toBe('req-safe_123:abc')
    expect(resolveRequestId(unsafeRequest)).not.toBe('not safe request id')
    expect(resolveRequestId(unsafeRequest)).toMatch(/^[A-Za-z0-9._:-]+$/)
  })

  it('preserves operator context in parsed admin messages', () => {
    const parsed = parseApiError(
      {
        code: 'storage_unavailable',
        error: 'Media storage is not configured.',
        action: 'Check Cloudflare R2 settings.',
        requestId: 'req_123',
      },
      'Upload failed'
    )

    expect(parsed.message).toContain('Media storage is not configured.')
    expect(parsed.message).toContain('Check Cloudflare R2 settings.')
    expect(parsed.message).toContain('Reference ID: req_123')
  })

  it('falls back cleanly when a response body is html instead of json', async () => {
    const response = new Response(
      '<!DOCTYPE html><html lang="en"><head><title>Error</title></head><body>Something went wrong.</body></html>',
      {
        status: 500,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }
    )

    const data = await readJsonResponse(response)
    const parsed = parseApiError(data, 'Unable to sign in.')

    expect(parsed.message).toBe('Unable to sign in.')
    expect(parsed.message).not.toContain('<!DOCTYPE')
    expect(parsed.message).not.toContain('<html')
  })

  it('does not render request-ID failures as success statuses', () => {
    expect(getAdminStatusTone('Media storage is not configured. Reference ID: req_123')).toBe('error')
    expect(getAdminStatusTone('Recovered a draft from yesterday.')).toBe('warning')
    expect(getAdminStatusTone('Review updated.')).toBe('success')
  })
})

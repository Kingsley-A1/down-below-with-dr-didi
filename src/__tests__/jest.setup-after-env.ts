import { destroySessionCache } from '@/lib/session-cache'
import { destroyResetSessionManager } from '@/lib/auth/reset-session'
import { getRateLimiter } from '@/lib/auth/rate-limiter'
import { resetRateLimitFallbacksForTests } from '@/lib/rate-limit'

jest.setTimeout(30_000)

afterEach(() => {
  resetRateLimitFallbacksForTests()
})

afterAll(() => {
  destroySessionCache()
  destroyResetSessionManager()
  getRateLimiter().destroy()
  resetRateLimitFallbacksForTests()
})

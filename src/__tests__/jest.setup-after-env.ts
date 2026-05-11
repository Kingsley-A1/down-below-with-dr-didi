import { destroySessionCache } from '@/lib/session-cache'
import { destroyResetSessionManager } from '@/lib/auth/reset-session'
import { getRateLimiter } from '@/lib/auth/rate-limiter'

afterAll(() => {
  destroySessionCache()
  destroyResetSessionManager()
  getRateLimiter().destroy()
})

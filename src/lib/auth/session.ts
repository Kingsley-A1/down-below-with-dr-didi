import { cookies } from 'next/headers'
import { AsyncLocalStorage } from 'node:async_hooks'
import { jwtVerify, SignJWT } from 'jose'
import { prisma } from '@/lib/prisma'

interface SessionUserRecord {
  id: string
  email: string
  displayName: string
  role: string
  isActive: boolean
  emailVerified: boolean
  lastActivityAt: Date
}

/**
 * User session interface
 * Matches the User model but with only essential public fields
 */
export interface UserSession {
  userId: string
  email: string
  displayName: string
  role: string
  isActive: boolean
  emailVerified: boolean
  iat: number // issued at timestamp
}

// Session configuration
const SESSION_COOKIE_NAME = 'user_session'
// Use longer max duration for JWT, actual timeout enforced via inactivity check
const SESSION_DURATION = 90 * 24 * 60 * 60 * 1000 // 90 days in milliseconds (max for either user type)
// Inactivity timeouts
const USER_INACTIVITY_TIMEOUT = 60 * 24 * 60 * 60 * 1000 // 60 days
const ADMIN_INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000 // 2 hours
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production'
)

/**
 * Create a user session and set cookie
 */
export async function createSession(user: UserSession): Promise<void> {
  const cookieStore = await cookies()

  // Create payload object that satisfies JWTPayload
  const payload: Record<string, string | boolean | number> = {
    userId: user.userId,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
  }

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('90d')
    .sign(SECRET)

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/',
  })
}

// Activity update debounce: only update if last update was more than 5 minutes ago
const ACTIVITY_UPDATE_DEBOUNCE_MS = 5 * 60 * 1000 // 5 minutes

type SessionCacheEntry = { timestamp: number; data: SessionUserRecord }
type SessionRequestStore = {
  sessionCacheByUserId: Map<string, SessionCacheEntry>
}

const sessionRequestContext = new AsyncLocalStorage<SessionRequestStore>()

function getOrCreateRequestStore(): SessionRequestStore {
  const existingStore = sessionRequestContext.getStore()
  if (existingStore) {
    return existingStore
  }

  const newStore: SessionRequestStore = {
    sessionCacheByUserId: new Map(),
  }
  sessionRequestContext.enterWith(newStore)
  return newStore
}

/**
 * Get current user session
 * Checks both JWT validity and inactivity timeout
 * Optimized to reduce database contention via:
 * - Per-request session caching
 * - Debounced activity updates (only every 5+ minutes)
 */
export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    const verified = await jwtVerify(token, SECRET)
    const payload = verified.payload as Record<string, unknown>
    const userId = payload.userId as string | undefined
    const requestStore = getOrCreateRequestStore()

    if (!userId) {
      await tryClearSessionCookie()
      return null
    }

    // Check if we have a cached session from earlier in this request
    const now = Date.now()
    const cachedSession = requestStore.sessionCacheByUserId.get(userId)
    if (cachedSession && now - cachedSession.timestamp < 1000) {
      const user = cachedSession.data
      const timeout = user.role === 'admin' ? ADMIN_INACTIVITY_TIMEOUT : USER_INACTIVITY_TIMEOUT
      const elapsedMs = now - user.lastActivityAt.getTime()

      if (elapsedMs > timeout) {
        await tryClearSessionCookie()
        requestStore.sessionCacheByUserId.delete(userId)
        return null
      }

      // Debounce activity update: only update if 5+ minutes have passed
      if (elapsedMs > ACTIVITY_UPDATE_DEBOUNCE_MS) {
        // Fire and forget - don't await, don't block response
        updateLastActivityAsync(user.id).catch((error) => {
          console.error('Error updating last activity:', error)
        })
      }

      return {
        userId: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        iat: (payload.iat as number) || Math.floor(Date.now() / 1000),
      }
    }

    const user = (await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastActivityAt: true,
      },
    })) as SessionUserRecord | null

    if (!user || !user.isActive) {
      await tryClearSessionCookie()
      requestStore.sessionCacheByUserId.delete(userId)
      return null
    }

    const timeout = user.role === 'admin' ? ADMIN_INACTIVITY_TIMEOUT : USER_INACTIVITY_TIMEOUT
    const elapsedMs = now - user.lastActivityAt.getTime()

    if (elapsedMs > timeout) {
      await tryClearSessionCookie()
      requestStore.sessionCacheByUserId.delete(userId)
      return null
    }

    // Cache this session for the duration of this request
    requestStore.sessionCacheByUserId.set(userId, { timestamp: now, data: user })

    // Debounce activity update: only update if 5+ minutes have passed since last activity
    if (elapsedMs > ACTIVITY_UPDATE_DEBOUNCE_MS) {
      // Fire and forget - don't await, don't block response
      updateLastActivityAsync(user.id).catch((error) => {
        console.error('Error updating last activity:', error)
      })
    }

    return {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      iat: (payload.iat as number) || Math.floor(Date.now() / 1000),
    }
  } catch {
    await tryClearSessionCookie()
    return null
  }
}

/**
 * Update user's last activity timestamp (async, fire-and-forget)
 * This is non-blocking to avoid slowing down request handling
 */
async function updateLastActivityAsync(userId: string): Promise<void> {
  try {
    // Add small random jitter to prevent thundering herd if many users update at once
    const jitterMs = Math.random() * 1000
    await new Promise((resolve) => setTimeout(resolve, jitterMs))

    await prisma.user.update({
      where: { id: userId },
      data: { lastActivityAt: new Date() },
    })
  } catch (error) {
    // Silently fail - activity updates are not critical for session management
  }
}

/**
 * Update user's last activity timestamp (legacy synchronous version)
 * @deprecated Use getSession() which handles updates automatically
 */
export async function updateLastActivity(userId: string): Promise<void> {
  // For backward compatibility, just await the async version
  await updateLastActivityAsync(userId)
}

/**
 * Clear user session (logout)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

async function tryClearSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)
  } catch {
    // Cookie deletion is best-effort when called outside mutable contexts.
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session !== null && session.isActive
}

/**
 * Require authentication (throw if not authenticated)
 */
export async function requireAuth(): Promise<UserSession> {
  const session = await getSession()
  if (!session || !session.isActive) {
    throw new Error('Unauthorized: No active session')
  }
  return session
}

/**
 * Get user ID from session
 */
export async function getUserId(): Promise<string | null> {
  const session = await getSession()
  return session?.userId || null
}

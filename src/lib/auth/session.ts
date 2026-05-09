import { cookies } from 'next/headers'
import { jwtVerify, SignJWT } from 'jose'
import { prisma } from '@/lib/prisma'

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

/**
 * Get current user session
 * Checks both JWT validity and inactivity timeout
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
    
    const session: UserSession = {
      userId: payload.userId as string,
      email: payload.email as string,
      displayName: payload.displayName as string,
      role: payload.role as string,
      isActive: payload.isActive as boolean,
      emailVerified: payload.emailVerified as boolean,
      iat: (payload.iat as number) || Math.floor(Date.now() / 1000),
    }

    // Check inactivity timeout
    const issuedAtMs = session.iat * 1000
    const elapsedMs = Date.now() - issuedAtMs
    const timeout = session.role === 'admin' ? ADMIN_INACTIVITY_TIMEOUT : USER_INACTIVITY_TIMEOUT

    if (elapsedMs > timeout) {
      // Session expired due to inactivity
      return null
    }

    return session
  } catch {
    return null
  }
}

/**
 * Update user's last activity timestamp
 */
export async function updateLastActivity(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastActivityAt: new Date() },
    })
  } catch (error) {
    console.error('Error updating last activity:', error)
    // Don't throw - this is non-critical for session management
  }
}

/**
 * Clear user session (logout)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
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

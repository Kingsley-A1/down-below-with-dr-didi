import { cookies } from 'next/headers'
import { jwtVerify, SignJWT } from 'jose'

/**
 * User session interface
 * Matches the User model but with only essential public fields
 */
export interface UserSession {
  userId: string
  email: string
  displayName: string
  isActive: boolean
  emailVerified: boolean
}

// Session configuration
const SESSION_COOKIE_NAME = 'user_session'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production'
)

/**
 * Create a user session and set cookie
 */
export async function createSession(user: UserSession): Promise<void> {
  const cookieStore = await cookies()

  // Create payload object that satisfies JWTPayload
  const payload: Record<string, string | boolean> = {
    userId: user.userId,
    email: user.email,
    displayName: user.displayName,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
  }

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
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
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      displayName: payload.displayName as string,
      isActive: payload.isActive as boolean,
      emailVerified: payload.emailVerified as boolean,
    }
  } catch {
    return null
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

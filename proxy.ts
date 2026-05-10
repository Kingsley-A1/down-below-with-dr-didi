import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin/session'

// Session verification cache: token -> verified session
const sessionVerificationCache = new Map<string, { session: unknown; expiresAt: number }>()
const CACHE_TTL_MS = 1000 // 1 second cache for rapid consecutive requests

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname === '/admin/sign-in') {
    return NextResponse.next()
  }

  const cookieValue = request.cookies.get(ADMIN_SESSION_COOKIE)?.value

  if (!cookieValue) {
    const signInUrl = new URL('/admin/sign-in', request.url)
    signInUrl.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(signInUrl)
  }

  // Check cache first
  const now = Date.now()
  const cached = sessionVerificationCache.get(cookieValue)
  if (cached && now < cached.expiresAt) {
    return cached.session ? NextResponse.next() : createSignInRedirect(pathname, search, request)
  }

  // Verify session and cache result
  const session = await verifyAdminSession(cookieValue)

  if (session) {
    // Cache successful verification
    sessionVerificationCache.set(cookieValue, {
      session: true,
      expiresAt: now + CACHE_TTL_MS,
    })
    return NextResponse.next()
  }

  // Cache failed verification (shorter TTL to catch re-authentication quickly)
  sessionVerificationCache.set(cookieValue, {
    session: null,
    expiresAt: now + 500, // 500ms for failed verifications
  })

  return createSignInRedirect(pathname, search, request)
}

function createSignInRedirect(pathname: string, search: string, request: NextRequest) {
  const signInUrl = new URL('/admin/sign-in', request.url)
  signInUrl.searchParams.set('next', `${pathname}${search}`)
  return NextResponse.redirect(signInUrl)
}

export const config = {
  matcher: ['/admin/:path*'],
}
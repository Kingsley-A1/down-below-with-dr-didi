import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin/session'

const PUBLIC_ADMIN_PATHS = new Set([
  '/admin/sign-in',
  '/admin/register',
  '/admin/verify-email',
  '/admin/forgot-password',
  '/admin/reset-password',
])

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (PUBLIC_ADMIN_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  const cookieValue = request.cookies.get(ADMIN_SESSION_COOKIE)?.value

  if (!cookieValue) {
    const signInUrl = new URL('/admin/sign-in', request.url)
    signInUrl.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(signInUrl)
  }

  // Verify session token for every protected admin request.
  const session = await verifyAdminSession(cookieValue)

  if (session) {
    return NextResponse.next()
  }

  return createSignInRedirect(pathname, search, request)
}

function createSignInRedirect(pathname: string, search: string, request: NextRequest) {
  const signInUrl = new URL('/admin/sign-in', request.url)
  signInUrl.searchParams.set('next', `${pathname}${search}`)
  return NextResponse.redirect(signInUrl)
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
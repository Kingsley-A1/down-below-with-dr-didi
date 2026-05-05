import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin/session'

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname === '/admin/sign-in') {
    return NextResponse.next()
  }

  const cookieValue = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const session = await verifyAdminSession(cookieValue)

  if (session) {
    return NextResponse.next()
  }

  const signInUrl = new URL('/admin/sign-in', request.url)
  signInUrl.searchParams.set('next', `${pathname}${search}`)

  return NextResponse.redirect(signInUrl)
}

export const config = {
  matcher: ['/admin/:path*'],
}
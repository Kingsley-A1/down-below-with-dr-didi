'use client'

import { usePathname } from 'next/navigation'

const AUTH_PAGES = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
])

export default function FooterVisibility({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''

  if (pathname.startsWith('/admin') || AUTH_PAGES.has(pathname)) {
    return null
  }

  return <>{children}</>
}
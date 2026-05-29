const DEFAULT_ADMIN_REDIRECT = '/admin'

export function sanitizeAdminNextPath(value: string | null | undefined): string {
  if (!value) {
    return DEFAULT_ADMIN_REDIRECT
  }

  const trimmed = value.trim()
  if (!trimmed || trimmed.startsWith('//')) {
    return DEFAULT_ADMIN_REDIRECT
  }

  try {
    const parsed = new URL(trimmed, 'https://downbelow.local')

    if (parsed.origin !== 'https://downbelow.local') {
      return DEFAULT_ADMIN_REDIRECT
    }

    const pathname = parsed.pathname
    if (pathname !== '/admin' && !pathname.startsWith('/admin/')) {
      return DEFAULT_ADMIN_REDIRECT
    }

    return `${pathname}${parsed.search}${parsed.hash}`
  } catch {
    return DEFAULT_ADMIN_REDIRECT
  }
}

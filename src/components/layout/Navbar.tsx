import { getSession } from '@/lib/auth/session'
import NavbarClient, { type NavbarInitialUser } from '@/components/layout/NavbarClient'

/**
 * Server shell for the public navbar. Reads the session cookie on every
 * render so the CTA paints with the correct auth state on first byte — no
 * flicker, no client-side `/api/auth/session` fetch, no focus polling.
 *
 * The client child handles presentation interactivity (scroll, mobile menu)
 * and revalidates this server component by calling `router.refresh()` when an
 * `auth-state-changed` event fires from login / logout.
 */
export default async function Navbar() {
  const session = await getSession()
  const initialAuthenticated = Boolean(session?.isActive)
  const initialUser: NavbarInitialUser | null = session
    ? { displayName: session.displayName, email: session.email }
    : null

  return <NavbarClient initialAuthenticated={initialAuthenticated} initialUser={initialUser} />
}

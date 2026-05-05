'use client'

import { useRouter } from 'next/navigation'

export default function AdminSignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    await fetch('/api/admin/session', {
      method: 'DELETE',
    })

    router.push('/admin/sign-in')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="font-body text-sm font-semibold px-4 py-2 rounded-full border"
      style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}
    >
      Sign Out
    </button>
  )
}
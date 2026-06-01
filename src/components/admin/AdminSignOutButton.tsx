'use client'

import { useRouter } from 'next/navigation'

export default function AdminSignOutButton({ className }: { className?: string }) {
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
      className={className || "font-body text-sm font-semibold px-4 py-2 rounded-full border border-[var(--color-border)] text-[var(--color-primary)] transition-colors hover:bg-black/5"}
    >
      Sign Out
    </button>
  )
}

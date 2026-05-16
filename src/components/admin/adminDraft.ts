'use client'

export type AdminDraft<T> = {
  value: T
  savedAt: string
}

export function readAdminDraft<T>(key: string): AdminDraft<T> | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(key)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AdminDraft<T>
  } catch {
    window.localStorage.removeItem(key)
    return null
  }
}

export function writeAdminDraft<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    key,
    JSON.stringify({
      value,
      savedAt: new Date().toISOString(),
    } satisfies AdminDraft<T>)
  )
}

export function clearAdminDraft(key: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(key)
}

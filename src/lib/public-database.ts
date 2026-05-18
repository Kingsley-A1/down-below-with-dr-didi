import { hasDatabaseConfig } from '@/lib/env'

const DEFAULT_PUBLIC_DATABASE_TIMEOUT_MS = 2_000
const PUBLIC_DATABASE_RETRY_DELAY_MS = 60_000

let unavailableUntilMs = 0

type PublicDatabaseReadInput<T> = {
  context: string
  fallback: T
  query: () => Promise<T>
  timeoutMs?: number
  onError?: (context: string, error: unknown) => void
}

function isTemporarilyUnavailable(): boolean {
  return Date.now() < unavailableUntilMs
}

function markTemporarilyUnavailable(): void {
  unavailableUntilMs = Date.now() + PUBLIC_DATABASE_RETRY_DELAY_MS
}

function createTimeoutError(context: string, timeoutMs: number): Error {
  return new Error(`Public database read timed out after ${timeoutMs}ms: ${context}`)
}

export async function readPublicDatabase<T>(input: PublicDatabaseReadInput<T>): Promise<T> {
  if (!hasDatabaseConfig() || isTemporarilyUnavailable()) {
    return input.fallback
  }

  const timeoutMs = input.timeoutMs ?? DEFAULT_PUBLIC_DATABASE_TIMEOUT_MS
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(createTimeoutError(input.context, timeoutMs)), timeoutMs)
    })

    return await Promise.race([input.query(), timeout])
  } catch (error) {
    markTemporarilyUnavailable()
    input.onError?.(input.context, error)
    return input.fallback
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

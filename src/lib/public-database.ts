import { hasDatabaseConfig } from '@/lib/env'

const DEFAULT_PUBLIC_DATABASE_TIMEOUT_MS = 2_000
const DEFAULT_PUBLIC_DATABASE_CACHE_TTL_MS = 60_000
const PUBLIC_DATABASE_RETRY_DELAY_MS = 60_000
const PUBLIC_DATABASE_FALLBACK_LOG_INTERVAL_MS = 5 * 60_000

let unavailableUntilMs = 0
const cacheByContext = new Map<string, { value: unknown; cachedAtMs: number }>()
const inFlightReads = new Map<string, Promise<unknown>>()
const fallbackLoggedAtMsByContext = new Map<string, number>()

type PublicDatabaseReadInput<T> = {
  context: string
  fallback: T
  query: () => Promise<T>
  timeoutMs?: number
  cacheTtlMs?: number
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

function getCachedValue<T>(context: string, maxAgeMs?: number): T | undefined {
  const entry = cacheByContext.get(context)

  if (!entry) {
    return undefined
  }

  if (maxAgeMs !== undefined && Date.now() - entry.cachedAtMs > maxAgeMs) {
    return undefined
  }

  return entry.value as T
}

function setCachedValue<T>(context: string, value: T): T {
  cacheByContext.set(context, {
    value,
    cachedAtMs: Date.now(),
  })

  return value
}

function readWithTimeout<T>(task: Promise<T>, context: string, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(createTimeoutError(context, timeoutMs)), timeoutMs)
  })

  return Promise.race([task, timeout]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })
}

function getOrCreateInFlightRead<T>(input: PublicDatabaseReadInput<T>): Promise<T> {
  const existing = inFlightReads.get(input.context) as Promise<T> | undefined

  if (existing) {
    return existing
  }

  const task = input
    .query()
    .then((value) => setCachedValue(input.context, value))
    .finally(() => {
      inFlightReads.delete(input.context)
    })

  inFlightReads.set(input.context, task)
  task.catch(() => undefined)

  return task
}

function shouldLogFallback(context: string): boolean {
  const now = Date.now()
  const lastLoggedAtMs = fallbackLoggedAtMsByContext.get(context) ?? 0

  if (now - lastLoggedAtMs < PUBLIC_DATABASE_FALLBACK_LOG_INTERVAL_MS) {
    return false
  }

  fallbackLoggedAtMsByContext.set(context, now)
  return true
}

export async function readPublicDatabase<T>(input: PublicDatabaseReadInput<T>): Promise<T> {
  const cacheTtlMs = input.cacheTtlMs ?? DEFAULT_PUBLIC_DATABASE_CACHE_TTL_MS
  const cached = getCachedValue<T>(input.context, cacheTtlMs)

  if (cached !== undefined) {
    return cached
  }

  if (!hasDatabaseConfig() || isTemporarilyUnavailable()) {
    return getCachedValue<T>(input.context) ?? input.fallback
  }

  const timeoutMs = input.timeoutMs ?? DEFAULT_PUBLIC_DATABASE_TIMEOUT_MS

  try {
    return await readWithTimeout(getOrCreateInFlightRead(input), input.context, timeoutMs)
  } catch (error) {
    markTemporarilyUnavailable()
    if (shouldLogFallback(input.context)) {
      input.onError?.(input.context, error)
    }
    return getCachedValue<T>(input.context) ?? input.fallback
  }
}

export function clearPublicDatabaseReadCache(): void {
  cacheByContext.clear()
  inFlightReads.clear()
  fallbackLoggedAtMsByContext.clear()
  unavailableUntilMs = 0
}

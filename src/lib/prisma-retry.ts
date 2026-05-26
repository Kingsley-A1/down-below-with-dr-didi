const TRANSIENT_PRISMA_CODES = new Set(['P1001', 'P1002', 'P1017', 'P2024'])
const TRANSIENT_DATABASE_MESSAGES = [
  'Server has closed the connection',
  'Connection terminated unexpectedly',
  'Connection terminated',
  'ECONNRESET',
  'ETIMEDOUT',
  'connect timeout',
  'timeout expired',
]

type RetryOptions = {
  attempts?: number
  delayMs?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getStringField(value: unknown, field: string): string | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const candidate = value[field]
  return typeof candidate === 'string' ? candidate : undefined
}

function getErrorText(error: unknown): string {
  const parts = [
    getStringField(error, 'name'),
    getStringField(error, 'code'),
    getStringField(error, 'message'),
  ]

  if (isRecord(error) && error.cause) {
    parts.push(getStringField(error.cause, 'code'), getStringField(error.cause, 'message'))
  }

  return parts.filter(Boolean).join(' ')
}

export function isTransientPrismaError(error: unknown): boolean {
  const code = getStringField(error, 'code')

  if (code && TRANSIENT_PRISMA_CODES.has(code)) {
    return true
  }

  const text = getErrorText(error)
  return TRANSIENT_DATABASE_MESSAGES.some((message) => text.includes(message))
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs)
  })
}

export async function withPrismaRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const attempts = options.attempts ?? 2
  const delayMs = options.delayMs ?? 150
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (attempt >= attempts || !isTransientPrismaError(error)) {
        throw error
      }

      await wait(delayMs * attempt)
    }
  }

  throw lastError
}

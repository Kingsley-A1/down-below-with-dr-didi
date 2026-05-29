const TRANSIENT_PRISMA_CODES = new Set(['P1001', 'P1002', 'P1017', 'P2024', 'P2028', 'P2034'])
const TRANSIENT_DATABASE_MESSAGES = [
  'Server has closed the connection',
  'Connection terminated unexpectedly',
  'Connection terminated',
  'A commit cannot be executed on an expired transaction',
  'ECONNRESET',
  'ETIMEDOUT',
  'Please retry your transaction',
  'Transaction API error',
  'deadlock',
  'connect timeout',
  'expired transaction',
  'timeout expired',
  'write conflict',
]
const TRANSIENT_TRANSACTION_CODES = new Set(['P2028', 'P2034'])
const TRANSIENT_TRANSACTION_MESSAGES = [
  'A commit cannot be executed on an expired transaction',
  'Please retry your transaction',
  'Transaction API error',
  'deadlock',
  'expired transaction',
  'write conflict',
]

type RetryOptions = {
  attempts?: number
  delayMs?: number
  shouldRetry?: (error: unknown) => boolean
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

export function isTransientPrismaTransactionError(error: unknown): boolean {
  const code = getStringField(error, 'code')

  if (code && TRANSIENT_TRANSACTION_CODES.has(code)) {
    return true
  }

  const text = getErrorText(error)
  return TRANSIENT_TRANSACTION_MESSAGES.some((message) => text.includes(message))
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
  const shouldRetry = options.shouldRetry ?? isTransientPrismaError
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (attempt >= attempts || !shouldRetry(error)) {
        throw error
      }

      await wait(delayMs * attempt)
    }
  }

  throw lastError
}

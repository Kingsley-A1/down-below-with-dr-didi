import type { NextRequest } from 'next/server'
import type { AuthErrorCode } from '@/lib/api/errors'

type ErrorIdentity = {
  email?: string | null
  role?: string | null
  userId?: string | null
}

export type ApiErrorLogContext = {
  request?: NextRequest
  requestId?: string
  route?: string
  identity?: ErrorIdentity | null
  metadata?: Record<string, unknown>
  error?: unknown
}

const SENSITIVE_KEY_PATTERN = /password|token|secret|cookie|authorization|session|key|otp|code/i
const REQUEST_ID_MAX_LENGTH = 128
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]+$/
const requestIds = new WeakMap<NextRequest, string>()

export function createRequestId() {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  return `req_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`
}

function normalizeRequestId(value?: string | null) {
  const trimmed = value?.trim()

  if (!trimmed || trimmed.length > REQUEST_ID_MAX_LENGTH || !REQUEST_ID_PATTERN.test(trimmed)) {
    return null
  }

  return trimmed
}

export function resolveRequestId(request?: NextRequest, explicitRequestId?: string) {
  const explicit = normalizeRequestId(explicitRequestId)
  if (explicit) {
    if (request) {
      requestIds.set(request, explicit)
    }
    return explicit
  }

  if (request) {
    const cached = requestIds.get(request)
    if (cached) {
      return cached
    }

    const headerRequestId =
      normalizeRequestId(request.headers.get('x-request-id')) ||
      normalizeRequestId(request.headers.get('x-correlation-id')) ||
      normalizeRequestId(request.headers.get('x-vercel-id'))

    const requestId = headerRequestId || createRequestId()
    requestIds.set(request, requestId)
    return requestId
  }

  return createRequestId()
}

function pathFromRequest(request?: NextRequest) {
  if (!request?.url) {
    return null
  }

  try {
    return new URL(request.url).pathname
  } catch {
    return null
  }
}

function pathFromStack(stack?: string) {
  if (!stack) {
    return null
  }

  const normalized = stack.replace(/\\/g, '/')
  const match = normalized.match(/src\/app\/api\/(.+?)\/route\.(?:ts|js|mjs)/)

  if (!match?.[1]) {
    return null
  }

  return `/api/${match[1]}`
}

function sanitizeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map(sanitizeValue)
  }

  if (typeof value === 'object' && value !== null) {
    return sanitizeMetadata(value as Record<string, unknown>)
  }

  if (typeof value === 'string') {
    return value.length > 500 ? `${value.slice(0, 500)}...` : value
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return value
  }

  return String(value)
}

export function sanitizeMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) {
    return undefined
  }

  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(metadata)) {
    sanitized[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[redacted]' : sanitizeValue(value)
  }

  return sanitized
}

function errorPayload(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    name: 'UnknownError',
    message: String(error),
  }
}

export function logApiServerError(input: {
  code: AuthErrorCode
  message: string
  requestId: string
  context?: ApiErrorLogContext
}) {
  const stack = new Error().stack
  const request = input.context?.request
  const route = input.context?.route || pathFromRequest(request) || pathFromStack(stack) || 'unknown'

  console.error('[api.error]', {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    service: 'downbelow-website',
    message: input.message,
    code: input.code,
    requestId: input.requestId,
    route,
    method: request?.method,
    identity: input.context?.identity
      ? {
          email: input.context.identity.email ?? undefined,
          role: input.context.identity.role ?? undefined,
          userId: input.context.identity.userId ?? undefined,
        }
      : undefined,
    metadata: sanitizeMetadata(input.context?.metadata),
    error: errorPayload(input.context?.error ?? input.message),
  })
}

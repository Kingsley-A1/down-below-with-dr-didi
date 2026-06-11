/**
 * Standard auth/API error response helpers.
 *
 * Every 4xx auth response uses one of the shapes below so client forms can
 * display field-level errors consistently without parsing per-route formats.
 *
 *   2xx                          { ok: true,  ...payload }
 *   4xx with field detail        { ok: false, code, error, fieldErrors? }
 *   4xx without field detail     { ok: false, code, error, retryAfter? }
 *
 * Codes are a stable enum (see AUTH-IMPLEMENTATION-SPEC.md / plan) — never
 * leak account-existence information through differentiated codes. Use
 * `invalidCredentials()` for both unknown email and wrong password.
 */

import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'
import {
  logApiServerError,
  resolveRequestId,
  type ApiErrorLogContext,
} from '@/lib/api/observability'

export type AuthErrorCode =
  | 'validation_failed'
  | 'duplicate_email'
  | 'invalid_credentials'
  | 'email_not_verified'
  | 'account_locked'
  | 'account_inactive'
  | 'rate_limited'
  | 'invalid_token'
  | 'unauthorized'
  | 'permission_denied'
  | 'not_found'
  | 'conflict'
  | 'database_unavailable'
  | 'storage_unavailable'
  | 'service_unavailable'
  | 'server_error'
  | 'admin_misconfigured'

export type AuthErrorBody = {
  ok: false
  code: AuthErrorCode
  error: string
  fieldErrors?: Record<string, string[]>
  formErrors?: string[]
  issues?: Array<{ path: Array<string | number>; message: string }>
  retryAfter?: number
  requestId?: string
  action?: string
}

type LegacyAuthErrorBody = AuthErrorBody & {
  success: false
  details?: { fieldErrors: Record<string, string[]> }
}

/**
 * Wrap a response body with legacy `success` + `details.fieldErrors` mirrors.
 * Older form code and tests read those fields; new code reads `ok` + `code` +
 * top-level `fieldErrors`. Both views describe the same response — this is a
 * temporary compatibility shim while every caller migrates.
 */
function withLegacyFields(body: AuthErrorBody): LegacyAuthErrorBody {
  const legacy: LegacyAuthErrorBody = { ...body, success: false }
  if (body.fieldErrors) {
    legacy.details = { fieldErrors: body.fieldErrors }
  }
  return legacy
}

function jsonError(status: number, body: AuthErrorBody, init?: { headers?: Record<string, string> }) {
  const headers = {
    ...init?.headers,
    ...(body.requestId ? { 'X-Request-ID': body.requestId } : {}),
  }

  return NextResponse.json(withLegacyFields(body), { status, headers })
}

/**
 * 400 — Zod validation failed. Returns flattened field errors so the form can
 * pin each message to the correct input. Plays well with react-hook-form
 * `setError(field, { message })`.
 */
export function validationError(error: ZodError, message = 'Please fix the highlighted fields.') {
  const flat = error.flatten() as {
    fieldErrors: Record<string, string[] | undefined>
    formErrors: string[]
  }
  // Drop any field with empty messages array so the response stays compact.
  const fieldErrors: Record<string, string[]> = {}
  for (const [field, messages] of Object.entries(flat.fieldErrors)) {
    if (Array.isArray(messages) && messages.length > 0) {
      fieldErrors[field] = messages
    }
  }

  const issues = error.issues.map((issue) => ({
    path: issue.path.map(String),
    message: issue.message,
  }))

  return jsonError(400, {
    ok: false,
    code: 'validation_failed',
    error: message,
    fieldErrors,
    formErrors: flat.formErrors,
    issues,
  })
}

/**
 * 400 — Domain validation failed outside Zod, for example a duplicate manual
 * sort position discovered inside a transaction.
 */
export function validationFailure(message: string, fieldErrors?: Record<string, string[]>) {
  return jsonError(400, {
    ok: false,
    code: 'validation_failed',
    error: message,
    ...(fieldErrors ? { fieldErrors } : {}),
  })
}

/**
 * 409 — Email already registered. Surfaced as a field error on `email` so the
 * form pins the message to that input. Public and admin variants share text to
 * avoid cross-channel enumeration.
 */
export function duplicateEmail(field = 'email', message = 'That email is already registered. Try signing in instead.') {
  return jsonError(409, {
    ok: false,
    code: 'duplicate_email',
    error: message,
    fieldErrors: { [field]: [message] },
  })
}

/**
 * 401 — Identical for unknown email and wrong password. No enumeration.
 */
export function invalidCredentials() {
  return jsonError(401, {
    ok: false,
    code: 'invalid_credentials',
    error: 'Invalid email or password',
  })
}

/**
 * 403 — Credentials valid but email is unverified. UI should surface a
 * "Resend verification email" CTA.
 */
export function emailNotVerified() {
  return jsonError(403, {
    ok: false,
    code: 'email_not_verified',
    error: 'Verify your email to continue. Enter the 6-digit code we sent to your inbox.',
  })
}

/**
 * 403 — Account is deactivated. Generic copy — never hints at the cause.
 */
export function accountInactive() {
  return jsonError(403, {
    ok: false,
    code: 'account_inactive',
    error: 'Account unavailable. Contact support.',
  })
}

/**
 * 423 — Too many failed login attempts. `retryAfter` is in seconds.
 */
export function accountLocked(retryAfter = 30 * 60) {
  // 429 instead of 423 so existing client code that special-cases 429-with-
  // Retry-After (rate limit / lockout treated together by the UI) continues
  // to work. The `code: 'account_locked'` field distinguishes lockout from
  // a generic rate limit when the UI cares.
  return jsonError(
    429,
    {
      ok: false,
      code: 'account_locked',
      error: 'Account temporarily locked due to too many failed attempts. Try again later.',
      retryAfter,
    },
    { headers: { 'Retry-After': String(retryAfter) } }
  )
}

/**
 * 429 — IP/identity rate limit. `retryAfter` is in seconds.
 */
export function rateLimited(retryAfter: number, message = 'Too many attempts. Please slow down and try again.') {
  return jsonError(
    429,
    {
      ok: false,
      code: 'rate_limited',
      error: message,
      retryAfter,
    },
    { headers: { 'Retry-After': String(retryAfter) } }
  )
}

/**
 * 400 — Reset/verify token is bad or expired.
 */
export function invalidToken(message = 'This link is invalid or has expired.') {
  return jsonError(400, {
    ok: false,
    code: 'invalid_token',
    error: message,
  })
}

/**
 * 401 — No active authenticated session for the requested operation.
 */
export function unauthorized(message = 'Sign in to continue.') {
  return jsonError(401, {
    ok: false,
    code: 'unauthorized',
    error: message,
  })
}

/**
 * 403 — Authenticated, but the account/role cannot perform this action.
 */
export function forbidden(message = 'You do not have permission to perform this action.', action?: string) {
  return jsonError(403, {
    ok: false,
    code: 'permission_denied',
    error: message,
    ...(action ? { action } : {}),
  })
}

/**
 * 404 — Requested entity does not exist or is unavailable to this user.
 */
export function notFound(message = 'The requested record was not found.') {
  return jsonError(404, {
    ok: false,
    code: 'not_found',
    error: message,
  })
}

/**
 * 409 — Request conflicts with an existing record or current state.
 */
export function conflict(message: string, fieldErrors?: Record<string, string[]>) {
  return jsonError(409, {
    ok: false,
    code: 'conflict',
    error: message,
    ...(fieldErrors ? { fieldErrors } : {}),
  })
}

/**
 * 503 — A required backend service is not available.
 */
export function serviceUnavailable(
  code: 'database_unavailable' | 'storage_unavailable' | 'service_unavailable',
  message: string,
  context?: ApiErrorLogContext & { action?: string }
) {
  const requestId = resolveRequestId(context?.request, context?.requestId)

  logApiServerError({
    code,
    message,
    requestId,
    context,
  })

  return jsonError(503, {
    ok: false,
    code,
    error: message,
    requestId,
    ...(context?.action ? { action: context.action } : {}),
  })
}

/**
 * 500 — Generic server failure. Don't leak stack traces.
 */
export function serverError(message = 'Something went wrong. Please try again.', context?: string | ApiErrorLogContext) {
  const normalizedContext = typeof context === 'string' ? { requestId: context } : context
  const requestId = resolveRequestId(normalizedContext?.request, normalizedContext?.requestId)

  logApiServerError({
    code: 'server_error',
    message,
    requestId,
    context: normalizedContext,
  })

  return jsonError(500, {
    ok: false,
    code: 'server_error',
    error: message,
    requestId,
  })
}

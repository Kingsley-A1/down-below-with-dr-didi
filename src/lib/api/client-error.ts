export interface ParsedApiError {
  message: string
  code?: string
  fieldErrors: Record<string, string[]>
  retryAfter?: number
  requestId?: string
  action?: string
}

interface ApiErrorLike {
  error?: unknown
  code?: unknown
  fieldErrors?: unknown
  details?: unknown
  issues?: unknown
  retryAfter?: unknown
  requestId?: unknown
  action?: unknown
}

const genericValidationMessages = new Set([
  'Validation failed',
  'Please fix the highlighted fields.',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }

  if (typeof value === 'string' && value.trim()) {
    return [value]
  }

  return []
}

function readFieldErrors(value: unknown): Record<string, string[]> {
  if (!isRecord(value)) {
    return {}
  }

  const fieldErrors: Record<string, string[]> = {}

  for (const [field, messages] of Object.entries(value)) {
    const normalizedMessages = toStringArray(messages)
    if (normalizedMessages.length > 0) {
      fieldErrors[field] = normalizedMessages
    }
  }

  return fieldErrors
}

function mergeFieldErrors(
  current: Record<string, string[]>,
  next: Record<string, string[]>
): Record<string, string[]> {
  const merged = { ...current }

  for (const [field, messages] of Object.entries(next)) {
    merged[field] = [...(merged[field] ?? []), ...messages]
  }

  return merged
}

function getDetailsFieldErrors(details: unknown): Record<string, string[]> {
  if (!isRecord(details)) {
    return {}
  }

  return readFieldErrors(details.fieldErrors)
}

function pathToField(path: unknown): string {
  if (Array.isArray(path) && path.length > 0) {
    return path.map(String).join('.')
  }

  return 'form'
}

function getIssueFieldErrors(issues: unknown): Record<string, string[]> {
  if (!Array.isArray(issues)) {
    return {}
  }

  const fieldErrors: Record<string, string[]> = {}

  for (const issue of issues) {
    if (!isRecord(issue) || typeof issue.message !== 'string' || !issue.message.trim()) {
      continue
    }

    const field = pathToField(issue.path)
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message]
  }

  return fieldErrors
}

function humanizeFieldName(field: string): string {
  if (field === 'form') {
    return 'Form'
  }

  return field
    .replace(/\.(\d+)\./g, ' $1 ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase())
}

function getFirstFieldMessage(fieldErrors: Record<string, string[]>): string | null {
  for (const [field, messages] of Object.entries(fieldErrors)) {
    const message = messages[0]
    if (message) {
      return field === 'form' ? message : `${humanizeFieldName(field)}: ${message}`
    }
  }

  return null
}

function getNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function looksLikeHtml(value: string): boolean {
  const trimmed = value.trim().toLowerCase()

  return (
    trimmed.startsWith('<!doctype html') ||
    trimmed.startsWith('<html') ||
    trimmed.startsWith('<head') ||
    trimmed.startsWith('<body') ||
    trimmed.includes('<html') ||
    trimmed.includes('<head') ||
    trimmed.includes('<body')
  )
}

function withOperatorContext(message: string, action?: string, requestId?: string): string {
  const details = [
    action,
    requestId ? `Reference ID: ${requestId}` : undefined,
  ].filter(Boolean)

  return details.length > 0 ? `${message} ${details.join(' ')}` : message
}

export function parseApiError(data: unknown, fallback: string): ParsedApiError {
  if (!isRecord(data)) {
    return { message: fallback, fieldErrors: {} }
  }

  const payload = data as ApiErrorLike
  const directFieldErrors = readFieldErrors(payload.fieldErrors)
  const detailsFieldErrors = getDetailsFieldErrors(payload.details)
  const issueFieldErrors = getIssueFieldErrors(payload.issues)
  const fieldErrors = mergeFieldErrors(mergeFieldErrors(directFieldErrors, detailsFieldErrors), issueFieldErrors)

  const rawMessage = getString(payload.error)
  const firstFieldMessage = getFirstFieldMessage(fieldErrors)
  const action = getString(payload.action)
  const requestId = getString(payload.requestId)
  const message =
    firstFieldMessage && (!rawMessage || genericValidationMessages.has(rawMessage))
      ? firstFieldMessage
      : rawMessage || firstFieldMessage || fallback

  return {
    message: withOperatorContext(message, action, requestId),
    fieldErrors,
    code: getString(payload.code),
    retryAfter: getNumber(payload.retryAfter),
    requestId,
    action,
  }
}

export function firstFieldErrorMessages(fieldErrors: Record<string, string[]>): Record<string, string> {
  const messages: Record<string, string> = {}

  for (const [field, fieldMessages] of Object.entries(fieldErrors)) {
    const message = fieldMessages[0]
    if (message) {
      messages[field] = message
    }
  }

  return messages
}

export async function readJsonResponse<T = unknown>(response: Response): Promise<T | null> {
  const text = await response.text()

  if (!text.trim()) {
    return null
  }

  try {
    return JSON.parse(text) as T
  } catch {
    if (looksLikeHtml(text)) {
      return { error: '' } as T
    }

    return { error: text.slice(0, 240) } as T
  }
}

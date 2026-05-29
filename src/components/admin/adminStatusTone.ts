export type AdminStatusTone = 'info' | 'success' | 'warning' | 'error'

const ERROR_PATTERNS = [
  'already',
  'cannot',
  'could not',
  'denied',
  'error',
  'failed',
  'invalid',
  'must',
  'not configured',
  'not sent',
  'permission',
  'reference id:',
  'required',
  'unable',
  'unavailable',
]

const WARNING_PATTERNS = [
  'choose',
  'missing',
  'paused',
  'recovered',
  'refresh',
  'retry',
]

export function getAdminStatusTone(message: string): AdminStatusTone {
  const value = message.toLowerCase()

  if (ERROR_PATTERNS.some((pattern) => value.includes(pattern))) {
    return 'error'
  }

  if (WARNING_PATTERNS.some((pattern) => value.includes(pattern))) {
    return 'warning'
  }

  return 'success'
}

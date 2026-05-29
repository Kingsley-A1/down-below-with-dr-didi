import type { AuthErrorCode } from '@/lib/api/errors'

export interface AppErrorOptions {
  code: AuthErrorCode
  message: string
  fieldErrors?: Record<string, string[]>
  action?: string
}

export interface AppError extends Error {
  code: AuthErrorCode
  fieldErrors?: Record<string, string[]>
  action?: string
  isAppError: true
}

export function createAppError(options: AppErrorOptions): AppError {
  const error = new Error(options.message) as AppError
  error.name = 'AppError'
  error.code = options.code
  error.isAppError = true

  if (options.fieldErrors) {
    error.fieldErrors = options.fieldErrors
  }

  if (options.action) {
    error.action = options.action
  }

  return error
}

export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { isAppError?: unknown }).isAppError === true &&
    typeof (error as { code?: unknown }).code === 'string' &&
    typeof (error as { message?: unknown }).message === 'string'
  )
}

export const appErrors = {
  validation(message: string, fieldErrors?: Record<string, string[]>) {
    return createAppError({ code: 'validation_failed', message, fieldErrors })
  },
  duplicateEmail(field = 'email') {
    return createAppError({
      code: 'duplicate_email',
      message: 'That email is already registered. Try signing in instead.',
      fieldErrors: { [field]: ['That email is already registered. Try signing in instead.'] },
    })
  },
  conflict(message: string, fieldErrors?: Record<string, string[]>) {
    return createAppError({ code: 'conflict', message, fieldErrors })
  },
  notFound(message: string) {
    return createAppError({ code: 'not_found', message })
  },
  databaseUnavailable(message = 'The database is not configured for this environment.') {
    return createAppError({ code: 'database_unavailable', message })
  },
  storageUnavailable(message = 'Media storage is not configured for this environment.') {
    return createAppError({ code: 'storage_unavailable', message })
  },
  permissionDenied(message: string, action?: string) {
    return createAppError({ code: 'permission_denied', message, action })
  },
}

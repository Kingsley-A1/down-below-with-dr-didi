type AdminPageLoadErrorInput = {
  page: string
  requestPath: string
  fallbackMessage: string
}

export type AdminPageLoadErrorResult = {
  requestId: string
  userMessage: string
}

function createRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

function toErrorPayload(error: unknown) {
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

export function logAdminPageLoadError(
  input: AdminPageLoadErrorInput,
  error: unknown
): AdminPageLoadErrorResult {
  const requestId = createRequestId()

  console.error('[admin.page.load_error]', {
    requestId,
    page: input.page,
    requestPath: input.requestPath,
    timestamp: new Date().toISOString(),
    ...toErrorPayload(error),
  })

  return {
    requestId,
    userMessage: input.fallbackMessage,
  }
}

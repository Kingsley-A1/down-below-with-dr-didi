import type { AuthErrorCode } from '@/lib/api/errors'

export type OperatorErrorReference = {
  code: AuthErrorCode
  meaning: string
  visibleImpact: string
  operatorAction: string
  logSearch: string
}

export const OPERATOR_ERROR_REFERENCE: OperatorErrorReference[] = [
  {
    code: 'validation_failed',
    meaning: 'The submitted fields did not pass validation.',
    visibleImpact: 'The user sees field-level messages or a precise form banner.',
    operatorAction: 'Ask the user to correct the highlighted fields. If no field is highlighted, check the form payload and schema.',
    logSearch: 'Usually not logged as a server error.',
  },
  {
    code: 'permission_denied',
    meaning: 'The signed-in admin role is below the required role for that action.',
    visibleImpact: 'The admin sees a permission message and the action is blocked.',
    operatorAction: 'Confirm the admin role in Admin Operators, then ask a super admin to update access if appropriate.',
    logSearch: 'Usually visible in the response body; not logged as a server fault.',
  },
  {
    code: 'database_unavailable',
    meaning: 'The application could not use the configured database for the requested operation.',
    visibleImpact: 'The user or admin sees a temporary database/service error with a Reference ID.',
    operatorAction: 'Check DATABASE_URL, run pending Prisma migrations, and verify the deployment database is reachable.',
    logSearch: 'Search server logs for the response Reference ID.',
  },
  {
    code: 'storage_unavailable',
    meaning: 'The media pipeline could not use Cloudflare R2.',
    visibleImpact: 'The admin sees an upload/media error with a Reference ID.',
    operatorAction: 'Check R2 account ID, bucket, access keys, public URL, and CORS policy.',
    logSearch: 'Search server logs for the response Reference ID.',
  },
  {
    code: 'service_unavailable',
    meaning: 'A required non-database service or feature gate is currently unavailable.',
    visibleImpact: 'The user or admin sees a temporary unavailable message with a suggested next step.',
    operatorAction: 'Check the action text in the response, then verify the related environment variable, service, or feature setting.',
    logSearch: 'Search server logs for the response Reference ID.',
  },
  {
    code: 'server_error',
    meaning: 'An unexpected server failure occurred.',
    visibleImpact: 'The user or admin sees a generic failure message with a Reference ID.',
    operatorAction: 'Search logs by Reference ID, inspect the structured error payload, then escalate to engineering if the fix is not operational.',
    logSearch: 'Search server logs for `[api.error]` and the response Reference ID.',
  },
]

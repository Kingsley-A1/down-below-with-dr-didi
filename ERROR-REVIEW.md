# DownBelow Error Handling Review

Source inspected on 2026-05-28. Scope: public API routes, admin API routes, shared error helpers, Zod validation paths, selected public/admin form components, admin page load warnings, and existing tests that pin error behavior. `.env.local` was not read.

## Executive Verdict

The codebase has started moving toward professional error handling, but it is currently split between three contracts. The newer auth routes use `ok`, `code`, `error`, and `fieldErrors` from `src/lib/api/errors.ts`. Most public/admin content routes still return `{ error: 'Validation failed', issues }`. Several account and notification routes return raw `error.message` to the client on `500`. The UI then handles each shape differently, so users and admins often see generic banners instead of the exact reason and next step.

The strategic fix is not more copy changes inside each form. The site needs one canonical API error envelope, one server-side mapping layer, and one client-side parser that every public/admin form uses. After that, Zod errors, permission errors, rate limits, database outages, R2 upload failures, duplicate slugs, and lockouts can all produce useful messages without exposing private internals.

## Current Error Model

| Layer | Current state | Evidence |
|---|---|---|
| New auth helper | Strong direction. Provides stable `code`, `fieldErrors`, `retryAfter`, legacy compatibility, and generic auth-safe messages. | `src/lib/api/errors.ts:17`, `src/lib/api/errors.ts:67`, `src/app/api/auth/register/route.ts:53`, `src/app/api/auth/login/route.ts:35`, `src/app/api/admin/register/route.ts:150` |
| Legacy validation routes | Still return `Validation failed` plus raw Zod `issues`. The route technically has details, but many clients ignore them. | `src/app/api/contact/route.ts:29`, `src/app/api/events/[slug]/comments/route.ts:53`, `src/app/api/admin/settings/route.ts:39`, `src/app/api/admin/events/route.ts:39`, `src/app/api/admin/admin-users/route.ts:43` |
| Mixed reset/profile routes | Return `{ success: false, error: 'Validation failed', details: ... }`, not the newer `ok/code/fieldErrors` shape. | `src/app/api/auth/reset-password/route.ts:40`, `src/app/api/admin/reset-password/route.ts:50`, `src/app/api/admin/change-password/route.ts:41`, `src/app/api/users/me/route.ts:65` |
| Generic mapper | `mapApiError` maps errors by string matching. It returns useful status codes sometimes, but it depends on plain `Error.message` text. | `src/lib/admin/api-guard.ts:39`, `src/lib/admin/api-guard.ts:47`, `src/lib/admin/api-guard.ts:54`, `src/lib/admin/api-guard.ts:59` |
| UI forms | Some auth forms read `fieldErrors`. Many public/admin forms only show `data.error`, so they display “Validation failed” instead of field-specific reasons. | `src/components/auth/RegisterForm.tsx:61`, `src/components/contact/ContactForm.tsx:37`, `src/components/auth/ProfileForm.tsx:72`, `src/components/admin/TeamMembersBoard.tsx:206`, `src/components/admin/EventsBoard.tsx:65` |
| Test suite | Some tests still assert the generic text, which will block the intended user-facing improvement unless updated. | `src/__tests__/integration/auth-register.integration.test.ts:122`, `src/__tests__/integration/vault-security-regression.integration.test.ts:113` |

## Findings

### P1 — Most route validation responses still collapse to `Validation failed`

Many route handlers correctly validate with Zod, but they return a generic top-level message and place the useful details under route-specific fields. A scan found 29 route-level validation responses still returning the literal `Validation failed`. Examples include public V-Vault, contact, reviews, event comments, and nearly every admin content module.

Evidence:

| File | Line | Problem |
|---|---:|---|
| `src/app/api/contact/route.ts` | 29 | Returns `{ error: 'Validation failed', issues: parsed.error.issues }`. |
| `src/app/api/vault/route.ts` | 51 | Same generic validation envelope. |
| `src/app/api/events/[slug]/comments/route.ts` | 53 | Same generic validation envelope. |
| `src/app/api/admin/events/route.ts` | 39 | Same generic validation envelope. |
| `src/app/api/admin/settings/route.ts` | 39 | Same generic validation envelope. |
| `src/app/api/admin/admin-users/route.ts` | 43 | Same generic validation envelope. |

Impact: operators see messages like “Validation failed” even when the server knows the exact cause, such as “End date must be after the start date,” “Bio must be at least 40 characters,” or “Slug may only contain lowercase letters, numbers, and hyphens.” This slows down admin work and creates avoidable support/debugging loops.

Recommended fix:

1. Promote `validationError()` from an auth helper into the universal API response helper.
2. Replace every `NextResponse.json({ error: 'Validation failed', issues: ... })` with the standard helper.
3. Keep a compatibility adapter only temporarily if older clients/tests still read `issues`.
4. Use a human top-level message such as `Please fix the highlighted fields.` for forms, while keeping `code: 'validation_failed'` stable for code.

Target response:

```ts
{
  ok: false,
  code: 'validation_failed',
  error: 'Please fix the highlighted fields.',
  fieldErrors: {
    startsAt: ['Start date must be a valid date.'],
    endsAt: ['End date must be after the start date.']
  },
  requestId: 'req_...'
}
```

### P1 — Several `500` paths send raw internal error messages to public clients

Some routes return `error instanceof Error ? error.message : fallback` in the JSON response. That can leak internal database/configuration messages, Prisma details, or implementation wording to users. It also creates inconsistent UX because the message may be written for developers, not humans.

Evidence:

| File | Line | Problem |
|---|---:|---|
| `src/app/api/users/me/route.ts` | 41 | GET profile returns raw error message on `500`. |
| `src/app/api/users/me/route.ts` | 140 | PUT profile returns raw error message on `500`. |
| `src/app/api/vault/me/route.ts` | 26 | V-Vault thread list returns raw error message on `500`. |
| `src/app/api/users/notifications/route.ts` | 27 | Notification list returns raw error message on `500`. |
| `src/app/api/gallery/route.ts` | 27 | Public gallery returns raw error message on `500`. |

Impact: a user/admin can receive messages that are either confusing or too revealing. This is especially risky around account, V-Vault, notification, and gallery endpoints because those routes touch user records, private submissions, or database-backed public content.

Recommended fix:

1. Log internal details server-side with a request ID.
2. Return a safe user-facing message and stable error code.
3. Add `requestId` to the response so operators can match a screenshot to logs.

Target response:

```ts
return apiError.internal(error, {
  code: 'profile_load_failed',
  message: 'We could not load your profile right now. Please refresh and try again.',
})
```

The log keeps the real exception. The client gets a supportable message.

### P1 — Client components do not consistently read field-level errors

The API often sends detailed validation data, but many forms ignore it. `ContactForm` does not parse the failed response body at all, so every server-side failure becomes the same red banner. `ProfileForm`, public reset password, and admin reset password read only `data.error`; they ignore `details.fieldErrors` and `fieldErrors`. Several admin boards also show only `data.error`.

Evidence:

| File | Line | Problem |
|---|---:|---|
| `src/components/contact/ContactForm.tsx` | 37 | Sets state from `res.ok` only; response body is ignored. |
| `src/components/contact/ContactForm.tsx` | 202 | Displays a generic “Something went wrong” banner. |
| `src/components/auth/ProfileForm.tsx` | 72 | Shows only `data.error` for profile update. |
| `src/components/auth/ProfileForm.tsx` | 107 | Shows only `data.error` for password change. |
| `src/components/auth/ResetPasswordForm.tsx` | 49 | Shows only `data.error`, so password field rules are not pinned to fields. |
| `src/components/admin/AdminResetPasswordForm.tsx` | 30 | Same reset-password issue on admin side. |
| `src/components/admin/TeamMembersBoard.tsx` | 206 | Shows only `data.error`, not Zod issue details. |

Counterexample: `EventsBoard` has a local `adminErrorMessage()` that extracts the first Zod issue from `issues` at `src/components/admin/EventsBoard.tsx:65`. That is the right idea, but it is local and not reused.

Impact: users do not know whether the issue is a short password, mismatched confirmation, invalid phone, bad URL, duplicate sort order, expired token, or database problem. Admins waste time retrying forms that will never succeed until a specific field is corrected.

Recommended fix:

1. Create `src/lib/api/client-error.ts` or `src/lib/api/client.ts` with one parser:

```ts
export type ParsedApiError = {
  message: string
  code?: string
  fieldErrors: Record<string, string[]>
  retryAfter?: number
  requestId?: string
}

export function parseApiError(data: unknown, fallback: string): ParsedApiError {
  // Support the new shape first.
  // Then temporarily support legacy details.fieldErrors.
  // Then support legacy issues[] by path/message.
}
```

2. Use that parser in every public/admin form.
3. For React Hook Form pages, map `fieldErrors` into `setError`.
4. For non-React-Hook-Form admin boards, show the first field error as `Field label: message` and keep the rest expandable if needed.

### P2 — Error shapes are inconsistent across adjacent auth/account routes

The new auth contract uses `ok: false`, `code`, `error`, and `fieldErrors`. Older account routes use `success: false`, `details`, or route-specific objects. Admin login has a custom `validation_failed` response. Public register/login use the helper. Public/admin reset password do not. `/api/users/me` does not.

Evidence:

| File | Line | Shape |
|---|---:|---|
| `src/lib/api/errors.ts` | 17 | Defines the new helper contract. |
| `src/app/api/auth/register/route.ts` | 53 | Uses `validationError()`. |
| `src/app/api/auth/login/route.ts` | 35 | Uses `validationError()`. |
| `src/app/api/admin/session/route.ts` | 48 | Custom inline validation response with similar but not identical shape. |
| `src/app/api/auth/reset-password/route.ts` | 40 | Uses `success: false` and `details`. |
| `src/app/api/admin/reset-password/route.ts` | 50 | Uses `success: false` and `details`. |
| `src/app/api/users/me/route.ts` | 65 | Uses `success: false` and `details`. |

Impact: every component has to guess which shape it might receive. This increases duplicated code and makes future UX improvements expensive because each route/component pair must be patched separately.

Recommended fix:

1. Rename or generalize `AuthErrorCode` to `ApiErrorCode`.
2. Keep `success: false` only as a temporary compatibility field if needed.
3. Standardize all new code on:

```ts
{
  ok: false,
  code: 'validation_failed',
  error: 'Please fix the highlighted fields.',
  fieldErrors: {},
  requestId: '...'
}
```

4. Add helper functions for `unauthorized`, `forbidden`, `notFound`, `conflict`, `rateLimited`, `serviceUnavailable`, `internal`, and `validation`.

### P2 — `mapApiError()` depends on fragile string matching

`mapApiError()` decides status codes by checking exact message text, suffixes like `not found`, and prefixes like `Validation failed:`. Repository functions throw plain `Error` values such as `Database is not configured`, `Site alert not found`, `Media asset not found`, and custom validation strings. This works only while wording stays unchanged.

Evidence:

| File | Line | Behavior |
|---|---:|---|
| `src/lib/admin/api-guard.ts` | 47 | Maps exact `Database is not configured` / `Cloudflare R2 is not configured` strings to `503`. |
| `src/lib/admin/api-guard.ts` | 51 | Maps suffix `not found` to `404`. |
| `src/lib/admin/api-guard.ts` | 54 | Maps prefix `Validation failed:` to `400`. |
| `src/lib/admin/api-guard.ts` | 59 | Everything else becomes fallback `500`. |
| `src/lib/admin/repository.ts` | 3288 | Throws a string-prefixed validation error for duplicate event sort order. |
| `src/lib/admin/repository.ts` | 3390 | Same pattern for update sort order. |

Impact: changing human copy can accidentally change API behavior. It also prevents the UI from distinguishing duplicate slug, duplicate sort order, missing record, storage outage, database outage, and permission failure in a stable way.

Recommended fix:

1. Introduce typed domain errors:

```ts
export class AppError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    public readonly status: number,
    message: string,
    public readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message)
  }
}
```

2. Replace string-prefix errors in repositories with typed errors:

```ts
throw new AppError(
  'duplicate_sort_order',
  409,
  `Sort order ${value} is already used by "${title}". Choose another position.`
)
```

3. Update `mapApiError()` to map by class/code first, then fall back to safe `500`.

### P2 — Admin account lockout status is inconsistent with the shared helper

The shared `accountLocked()` helper documents compatibility with `429` and includes a `Retry-After` header. Admin sign-in returns `423` with a body retry value and no `Retry-After` header for lockout. The admin UI checks the `code`, so it still works, but operationally the API contract is inconsistent.

Evidence:

| File | Line | Problem |
|---|---:|---|
| `src/lib/api/errors.ts` | 135 | Shared helper returns rate-limit-compatible lockout response. |
| `src/lib/api/errors.ts` | 148 | Shared helper sets `Retry-After`. |
| `src/app/api/admin/session/route.ts` | 75 | Handles account lockout manually. |
| `src/app/api/admin/session/route.ts` | 84 | Returns status `423` instead of the shared helper pattern. |

Impact: client code, tests, monitoring, and retry behavior can diverge between public and admin auth. Operators may also see different timing behavior for what is conceptually the same lockout class.

Recommended fix:

Use the shared `accountLocked()` helper or create a deliberate `locked()` helper that is documented and used consistently across public and admin flows. If `423` is intentionally preferred for admin, add `Retry-After` and document the difference.

### P2 — Permission responses expose implementation details but not recovery guidance

`requireAdminRole()` returns `requiredRole` and `currentRole` in the response. That is useful for developers, but the visible message is still terse: `Insufficient permissions. editor role is required.` It does not tell an operator what action is possible: switch account, request access, or ask a super admin.

Evidence:

| File | Line | Problem |
|---|---:|---|
| `src/lib/admin/api-guard.ts` | 24 | Role guard is centralized. |
| `src/lib/admin/api-guard.ts` | 31 | User-facing message is role-code style. |
| `src/lib/admin/api-guard.ts` | 32 | Returns `requiredRole`. |
| `src/lib/admin/api-guard.ts` | 33 | Returns `currentRole`. |

Impact: admins know they are blocked, but not what to do next. The response is also not in the standard error envelope.

Recommended fix:

Return a standard `forbidden` response:

```ts
{
  ok: false,
  code: 'permission_denied',
  error: 'You need editor access or higher to save this record.',
  action: 'Ask a super admin to update your role or sign in with an authorized account.'
}
```

Keep `requiredRole/currentRole` only if the requester is authenticated admin and only if the team wants that debugging detail exposed.

### P2 — Tests currently protect the generic error behavior

Some tests explicitly expect `Validation failed`. That made sense for the old contract, but it now works against the product goal: users/admins should understand the error cause.

Evidence:

| File | Line | Problem |
|---|---:|---|
| `src/__tests__/integration/auth-register.integration.test.ts` | 122 | Expects `body.error` to equal `Validation failed`. |
| `src/__tests__/integration/vault-security-regression.integration.test.ts` | 113 | Expects generic validation text. |
| `src/__tests__/integration/vault-security-regression.integration.test.ts` | 140 | Expects generic validation text. |

Impact: once the API returns better top-level messages such as `Please fix the highlighted fields.`, tests will fail unless they are updated to assert stable codes and field-level detail.

Recommended fix:

Change tests to assert:

```ts
expect(body.code).toBe('validation_failed')
expect(body.fieldErrors.question?.[0]).toContain('50 characters')
```

For security-sensitive flows, assert that forbidden/unauthorized behavior still does not leak identity or private data, but avoid pinning generic copy as the contract.

### P3 — Admin page load errors have a useful request ID pattern that API routes should reuse

Admin server pages use `logAdminPageLoadError()` to log internals and show a friendly message with a request ID. This is a good pattern. API routes should use the same idea so form failures can be connected to server logs.

Evidence:

| File | Line | Positive pattern |
|---|---:|---|
| `src/lib/admin/observability.ts` | 25 | Generates request IDs. |
| `src/lib/admin/observability.ts` | 39 | Logs structured payload with page/path/timestamp/error details. |
| `src/components/admin/AdminDataLoadAlert.tsx` | 22 | Shows a friendly user message. |
| `src/components/admin/AdminDataLoadAlert.tsx` | 29 | Shows a reference ID. |
| `src/app/admin/events/page.tsx` | 20 | Applies the pattern for admin event data load failure. |

Recommended fix:

Move the request ID creation into the shared API error helper and return `requestId` on all `5xx` responses. Admin data-load pages and API form submissions should share the same observability standard.

## Recommended Target Architecture

### One API error envelope

Use one response shape for all public and admin JSON errors.

```ts
type ApiErrorResponse = {
  ok: false
  code:
    | 'validation_failed'
    | 'invalid_credentials'
    | 'email_not_verified'
    | 'account_locked'
    | 'rate_limited'
    | 'permission_denied'
    | 'not_found'
    | 'conflict'
    | 'database_unavailable'
    | 'storage_unavailable'
    | 'invalid_token'
    | 'server_error'
  error: string
  fieldErrors?: Record<string, string[]>
  retryAfter?: number
  requestId?: string
  action?: string
}
```

Keep `success: false` and `details.fieldErrors` only while migrating older components. New code should not add more custom shapes.

### One server helper

Extend `src/lib/api/errors.ts` instead of creating another helper. It already has the right direction and legacy bridge. The next version should handle all route classes, not only auth.

```ts
export function forbidden(message: string, action?: string) {
  return jsonError(403, {
    ok: false,
    code: 'permission_denied',
    error: message,
    ...(action ? { action } : {}),
  })
}

export function serviceUnavailable(code: 'database_unavailable' | 'storage_unavailable', message: string) {
  return jsonError(503, { ok: false, code, error: message })
}
```

### One client parser

Every component should call one parser before deciding what to display.

```ts
const parsed = parseApiError(data, 'Save failed.')

for (const [field, messages] of Object.entries(parsed.fieldErrors)) {
  setError(field as keyof FormData, { message: messages[0] })
}

setMessage(parsed.message)
```

The parser should temporarily support all existing shapes:

| Shape | Parser behavior |
|---|---|
| `fieldErrors` | Use directly. |
| `details.fieldErrors` | Convert to `fieldErrors`. |
| `issues[]` | Convert each `path/message` into `fieldErrors`. |
| `error` only | Use as banner message. |
| Non-JSON response | Use fallback and include status if helpful. |

## Migration Plan

### Phase 1 — Stop generic validation messages where it hurts most

1. Extend `src/lib/api/errors.ts` into a universal helper.
2. Add the shared client parser.
3. Migrate public-facing forms first: Contact, V-Vault, reviews, event comments, profile, reset password.
4. Migrate admin content boards next: settings, alerts, team, gallery, events, library, podcast, reviews, admin-users, vault moderation.
5. Update tests to assert `code` and `fieldErrors`, not generic copy.

### Phase 2 — Replace string-matched domain errors

1. Add typed `AppError` classes or a small error factory.
2. Replace repository `throw new Error('Validation failed: ...')` with typed domain errors.
3. Replace `mapApiError()` string matching with class/code matching.
4. Add route tests for duplicate sort order, not found, database unavailable, R2 unavailable, and permission denied.

### Phase 3 — Add observability and operator support

1. Generate `requestId` inside all `5xx` API error responses.
2. Log structured server errors with route, requestId, code, user/admin identity when available, and sanitized metadata.
3. Show request IDs in admin-facing failure banners.
4. Add an operator-facing error reference table in admin docs or `/admin/health`.

## Route Groups to Prioritize

| Priority | Route/component group | Why |
|---|---|---|
| 1 | `/api/users/me`, `/api/vault/me`, `/api/users/notifications/*` | Account/private workflows should not leak raw internals and should tell users what to do. |
| 1 | Contact, V-Vault, reviews, event comments | Public forms currently produce generic failure experiences. |
| 1 | Admin settings/events/library/media/admin-users | Admin operators need exact cause to fix records quickly. |
| 2 | Reset password flows | Password errors should land on the exact field and token failures should be clear. |
| 2 | `mapApiError()` and repository errors | Reduces future maintenance risk. |
| 3 | Tests and docs | Locks in the better contract. |

## Acceptance Criteria for a Professional Error System

| Requirement | Pass condition |
|---|---|
| Users know what failed | Validation errors appear beside the exact field or as a precise banner. |
| Admins know what to do next | Permission, database, storage, and validation errors include practical recovery copy. |
| Internals stay private | No public `500` response returns raw exception messages. |
| Code is stable | Clients branch on `code`, not human text. |
| Forms are consistent | Every form can consume `fieldErrors`, retry timing, and request IDs through one parser. |
| Operators can debug | Server logs include request IDs that match admin-visible reference IDs. |
| Tests protect behavior | Tests assert codes and field errors, not generic strings. |

## Concrete First Patch Set

1. Update `src/lib/api/errors.ts` to export `unauthorized()`, `forbidden()`, `notFound()`, `conflict()`, `serviceUnavailable()`, and `internalError()`.
2. Add `src/lib/api/client-error.ts` with `parseApiError()`.
3. Replace validation responses in these first routes:
   - `src/app/api/contact/route.ts`
   - `src/app/api/vault/route.ts`
   - `src/app/api/reviews/route.ts`
   - `src/app/api/events/[slug]/comments/route.ts`
   - `src/app/api/users/me/route.ts`
4. Update these first components:
   - `src/components/contact/ContactForm.tsx`
   - `src/components/vault/VaultForm.tsx`
   - `src/components/reviews/ReviewSubmissionForm.tsx`
   - `src/components/events/CommentForm.tsx`
   - `src/components/auth/ProfileForm.tsx`
   - `src/components/auth/ResetPasswordForm.tsx`
5. Update tests that currently assert `Validation failed`.

This patch set would immediately remove the worst public/admin UX issues without requiring the whole admin control plane to be migrated in one commit.

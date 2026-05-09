# Production Code Review Tracker

Date: 2026-05-07
Scope: Current working tree on branch `main`
Reviewer: GitHub Copilot (GPT-5.3-Codex)

## Summary

- Total findings: 10
- Critical: 1 (0 open)
- High: 3 (0 open)
- Medium: 3 (1 open — MD-003 planned)
- Low: 3 (0 open)
- **Tooling status: `npx tsc --noEmit` ✅ 0 errors; `npm run lint` ✅ 0 errors, 0 warnings**
- Last updated: 2026-05-08 (MD-001, MD-002, LO-001, LO-002, LO-003 remediated)

## Findings

| ID | Severity | Area | Finding | Evidence | Impact | Recommended Fix | Status |
|---|---|---|---|---|---|---|---|
| CR-001 | Critical | Security / Auth | Insecure default admin secrets are accepted when environment variables are missing. | `src/lib/env.ts` lines 12-13 define fallback defaults for `ADMIN_SESSION_SECRET` and `ADMIN_ACCESS_CODE`. | If production env is misconfigured, admin session signing secret and access code become predictable, enabling unauthorized admin access. | Remove insecure defaults for admin secrets in production paths. Fail fast if either value is missing/weak. Add startup guard in production mode. | **Fixed 2026-05-07** |
| HI-001 | High | API Authorization | Admin settings endpoint exposes `GET` without authentication. | `src/app/api/admin/settings/route.ts` lines 11-12 return settings directly, no session check. | Unauthenticated users can read managed site settings and operational contact data from admin API namespace. | Require authenticated admin session for `GET` (same as `PUT`). | **Fixed 2026-05-07** |
| HI-002 | High | API Authorization | Admin media endpoint exposes `GET` without authentication. | `src/app/api/admin/media/route.ts` lines 27-28 return media assets without session verification. | Unauthenticated users can enumerate uploaded asset metadata and URLs. | Require admin session on `GET`, or explicitly move to a public endpoint with intentional filtering. | **Fixed 2026-05-07** |
| HI-003 | High | Build Stability | Type mismatch in admin settings update flow breaks typecheck. | `src/app/api/admin/settings/route.ts` line 31 passes `parsed.data` to `saveSiteSettings`; schema allows `heroImageUrl/heroImageAlt` optional while `SiteSettingsState` requires strings (`src/lib/site-config.ts`). | CI/production build gates fail on typecheck (`npx tsc --noEmit`). | Normalize payload before `saveSiteSettings` (coerce undefined to empty string), or align schema/types so contract is consistent. | **Fixed 2026-05-07** |
| MD-001 | Medium | Product Workflow | Contact API remains prototype behavior (logs and returns success only). | `src/app/api/contact/route.ts` lines 18-20 include prototype comment and `console.log`. | Contact requests are not persisted/tracked and no operational handoff is guaranteed. | Persist to DB and/or implement production notification workflow. Remove PII logging. | **Fixed 2026-05-08** |
| MD-002 | Medium | Abuse Protection | Public POST endpoints lack anti-abuse controls (rate limit/challenge). | `src/app/api/contact/route.ts` and `src/app/api/vault/route.ts` accept unauthenticated submission with validation only. | Elevated risk of spam, queue flooding, and moderation overhead. | Add rate limiting (IP/token bucket), optional CAPTCHA, and minimal telemetry for abuse detection. | **Fixed 2026-05-08** |
| MD-003 | Medium | Prototype Debt | Public pages still rely on static prototype data sources. | `src/app/library/page.tsx` imports `src/data/articles.ts`; `src/app/outreach/page.tsx` imports `src/data/outreach.ts`; `src/app/about/page.tsx` imports `src/data/team.ts`. | Content remains code-coupled and not admin-manageable, slowing editorial updates and increasing release risk. | Migrate these surfaces to DB-backed/admin-managed content models. | **Planned — see workstream below** |
| LO-001 | Low | Code Quality | Unused variable in admin sign-out route. | `src/app/api/admin/session/route.ts` line 52 defines `token` but never uses it. | Minor lint noise; obscures meaningful warnings. | Remove unused variable or use it intentionally (e.g., sign-out audit). | **Fixed 2026-05-08** |
| LO-002 | Low | Code Quality | Unused helper function in admin session utility. | `src/lib/admin/session.ts` line 61 defines `bytesToText` but it is unused. | Minor maintainability issue. | Remove dead helper or use where needed. | **Fixed 2026-05-08** |
| LO-003 | Low | Lint/Compiler Hygiene | Lint warnings in UI code remain unresolved. | `src/components/vault/VaultForm.tsx` line 73 (React compiler incompatible-library warning on `watch()`). | No immediate runtime failure, but warning debt accumulates and may hide regressions. | Replaced `watch()` with `useWatch({ control })` — React Compiler compatible. | **Fixed 2026-05-08** |

## Residual Prototype Items to Track (MD-003 Workstream)

**Status:** Planned — `Article`, `OutreachEvent`, and team content models exist in the Prisma schema but public pages still render from static `src/data/` files. Migration should be sequenced as three independent feature branches:

| Surface | Static source | Target model | Priority |
|---|---|---|---|
| Library (`/library`) | `src/data/articles.ts` | `Article` (schema exists) | P1 — highest reader value |
| Outreach (`/outreach`) | `src/data/outreach.ts` | `OutreachEvent` (schema exists) | P2 |
| About/Team (`/about`) | `src/data/team.ts` | No schema model yet — needs `TeamMember` model | P3 |

Each branch should: (1) seed production data from the static file, (2) add admin CRUD routes + UI, (3) switch the public page to a DB query, (4) delete the static file.

## Tool Output (Verification)

### Typecheck (post-full remediation — 2026-05-08)
- Command: `npx tsc --noEmit`
- Result: ✅ **0 errors**

### Lint (post-full remediation — 2026-05-08)
- Command: `npm run lint`
- Result: ✅ **0 errors, 0 warnings**

### What was changed for MD-001 / MD-002 (2026-05-08)
- Added `ContactSubmission` Prisma model; migration `20260507133814_add_contact_submission` applied.
- Added `createContactSubmission()` to `src/lib/admin/repository.ts`.
- `src/app/api/contact/route.ts` — removed `console.log` PII leak; now persists to `ContactSubmission` table; applies sliding-window rate limit (5 req / 10 min per IP).
- `src/app/api/vault/route.ts` — applies sliding-window rate limit (10 req / 10 min per IP).
- New `src/lib/rate-limit.ts` — single-process in-memory limiter; replace with `@upstash/ratelimit` if multi-replica deployment is needed.

### What was changed for LO-001 / LO-002 / LO-003 (2026-05-07–08)
- LO-001: Removed unused `token` read and unused `request` parameter from `DELETE` handler in `src/app/api/admin/session/route.ts`.
- LO-002: Removed dead `bytesToText` helper from `src/lib/admin/session.ts`.
- LO-003: Replaced `watch('question', '')` with `useWatch({ control, name: 'question', defaultValue: '' })` in `src/components/vault/VaultForm.tsx` — eliminates React Compiler incompatible-library warning.

## Recommended Fix Order

1. Fix CR-001 (secrets hardening) before any deployment.
2. Fix HI-001 and HI-002 (admin API auth gaps).
3. Fix HI-003 (type contract mismatch) to restore clean CI.
4. Address MD-001 and MD-002 (operational workflow + abuse protection).
5. Plan MD-003 migration workstream for remaining static content.
6. Clear low-priority lint/quality findings.

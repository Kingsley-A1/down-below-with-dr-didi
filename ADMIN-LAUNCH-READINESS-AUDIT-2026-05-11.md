# Admin Launch Readiness Audit (2026-05-11)

## Scope
This audit covers the admin system end-to-end:
- Registration and access control (admin sign-in, user/admin role gating)
- Day-to-day admin operations (settings, team, gallery, podcast, vault, user management)
- Upload/storage pipeline (media upload, asset lifecycle)
- Test/build readiness and launch controls

## Status Snapshot (Updated)
- Build gate: ✅ `pnpm run verify:release` now passes.
- Test gate: ✅ 11/11 suites and 141/141 tests passing in the latest full run.
- P0: ✅ 4 of 4 closed.
- P1: ✅ 5 closed, 🟡 1 partial/decision pending.
- P2: ✅ 3 of 3 closed.
- Canonical checklist: `ADMIN-LAUNCH-CHECKLIST.md`.

## Executive Assessment
The admin platform has moved from partially launch-ready to near launch-ready from a core security and release-gate perspective.

Remaining work is now primarily:
1. Product/ops decision on V-Vault launch mode.
2. Final launch decision and go-live execution.

---

## P0 (Must fix before launch)

### 1) Split admin auth models break user-management module
Status: ✅ Closed

Completed:
- Admin users pages and API routes are aligned with admin-cookie auth (`dbfh_admin_session`) and admin RBAC.
- Legacy `session.role === 'admin'` checks in this module were removed/migrated.

Primary implementation touchpoints:
- `src/app/admin/users/page.tsx`
- `src/app/admin/users/[slug]/page.tsx`
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/users/[id]/route.ts`
- `src/app/api/admin/users/[id]/activate/route.ts`
- `src/app/api/admin/users/[id]/deactivate/route.ts`

### 2) Unauthorized handling in legacy admin-user APIs returns 500 instead of 401/403
Status: ✅ Closed

Completed:
- Unauthorized and forbidden flows now return proper 401/403 semantics in consolidated admin-user endpoints.
- Generic error conversion to 500 for auth failures was eliminated for these routes.

Primary implementation touchpoints:
- `src/lib/admin/api-guard.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/users/[id]/route.ts`
- `src/app/api/admin/users/[id]/activate/route.ts`
- `src/app/api/admin/users/[id]/deactivate/route.ts`

### 3) Admin sign-in lacks brute-force/rate-limit protection
Status: ✅ Closed

Completed:
- Added IP and identity-based rate limiting.
- Added lockout/backoff behavior.
- Added failure audit logging for blocked and failed attempts.

Primary implementation touchpoint:
- `src/app/api/admin/session/route.ts`

### 4) Build and test verification gates are currently broken
Status: ✅ Closed

Completed:
- TypeScript and Jest config alignment fixed.
- Integration suite drift corrected.
- Release script gate now runs typecheck + Jest in-band and passes.

Primary implementation touchpoints:
- `package.json`
- `jest.config.js`
- `src/__tests__/integration/setup.ts`
- `src/__tests__/integration/*.integration.test.ts`
- `src/__tests__/mocks/jose.ts`

---

## P1 (High priority, launch window)

### 5) Admin role hierarchy exists but is not enforced in admin APIs
Status: ✅ Closed

Completed:
- Enforced route-level role checks using shared API guard helpers.
- Applied permissions to team/gallery/podcast/settings/media/vault and user-management paths.

Primary implementation touchpoint:
- `src/lib/admin/api-guard.ts`

### 6) Media upload pipeline lacks production guardrails
Status: ✅ Closed

Completed:
- MIME allowlist introduced.
- Per-kind size limits introduced.
- Input constraints (label/alt text lengths) enforced.

Primary implementation touchpoint:
- `src/app/api/admin/media/route.ts`

### 7) Asset lifecycle management is incomplete (orphaned R2 files risk)
Status: ✅ Closed

Completed:
- Added dependency-aware delete preview and protected delete path.
- Added R2 object deletion.
- Added media delete UI workflow with in-use conflict feedback.

Primary implementation touchpoints:
- `src/app/api/admin/media/[id]/route.ts`
- `src/lib/admin/repository.ts`
- `src/lib/storage/r2.ts`
- `src/components/admin/MediaLibrary.tsx`

### 8) Team/Gallery admin forms are URL-driven, not upload-integrated
Status: ✅ Closed

Completed:
- Team and gallery forms now support direct media upload flow and auto-fill URL behavior.

Primary implementation touchpoints:
- `src/components/admin/TeamMembersBoard.tsx`
- `src/components/admin/GalleryImagesBoard.tsx`
- `src/components/admin/media-upload.ts`

### 9) Public V-Vault submissions are disabled while backend/form components still exist
Status: 🟡 Partial (Engineering done, product decision pending)

Completed:
- Introduced explicit feature flag `VAULT_SUBMISSIONS_ENABLED`.
- API and UI now consistently honor enabled/paused mode.

Remaining decision:
1. Set final launch default for `VAULT_SUBMISSIONS_ENABLED`.
2. Confirm moderation SOP and support playbook for enabled mode.

Primary implementation touchpoints:
- `src/lib/env.ts`
- `src/app/api/vault/route.ts`
- `src/app/vault/page.tsx`

### 10) Contact submission can silently succeed without persistence when DB is absent
Status: ✅ Closed

Completed:
- Contact flow now fails explicitly if DB is unavailable (no silent success path).

Primary implementation touchpoints:
- `src/lib/admin/repository.ts`
- `src/app/api/contact/route.ts`

---

## P2 (Important, continue immediately)

### 11) Admin observability is weak in page-level data failures
Status: ✅ Closed

Completed:
1. Added explicit operator-facing admin data-load alerts.
2. Added structured logging with per-failure reference IDs.

Primary implementation touchpoints:
- `src/lib/admin/observability.ts`
- `src/components/admin/AdminDataLoadAlert.tsx`
- `src/app/admin/team/page.tsx`
- `src/app/admin/gallery/page.tsx`
- `src/app/admin/podcast/page.tsx`

### 12) Proxy cache has no pruning strategy
Status: ✅ Closed

Completed:
1. Added bounded pruning to the proxy verification cache.
2. Added lightweight cache-size metric logging hooks.

Primary implementation touchpoint:
- `proxy.ts`

### 13) Documentation and implementation are out of sync
Status: ✅ Closed

Completed:
1. Updated project status docs with current verification and readiness state.
2. Published one canonical launch checklist and linked it from status documents.

Primary implementation touchpoints:
- `ADMIN-LAUNCH-CHECKLIST.md`
- `PROJECT-STATUS.md`
- `PHASE4-README.md`
- `dev-plans/production-upgrade-plan.md`

---

## Exact Continuation Plan (Do This Next)

1. Decide V-Vault launch mode and lock env defaults.
   - Owner: Product + Ops
   - Output: final `VAULT_SUBMISSIONS_ENABLED` default and SOP.

2. Execute final pre-launch operational checks from `ADMIN-LAUNCH-CHECKLIST.md`.

3. Run production go/no-go review and schedule rollout.

---

## Current Launch Call
Core P0, P1 (engineering scope), and P2 hardening items are closed and re-verified. Do not execute production launch until the V-Vault product decision is finalized.

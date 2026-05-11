# Admin Launch Checklist (Canonical)

Last updated: 2026-05-11

This is the canonical launch checklist for admin readiness. Other status and phase documents should link here instead of duplicating checklist state.

## Release Gate

- [x] Typecheck and tests pass via `pnpm run verify:release`.
- [x] Latest verification result: 11/11 suites and 141/141 tests passing.
- [x] Jest process exits cleanly (no open handle blocker).

## P0 Launch Blockers

- [x] Admin auth model split fixed for user-management routes.
- [x] Unauthorized responses return 401/403 instead of 500 in admin-user APIs.
- [x] Admin sign-in brute-force protections are active.
- [x] Build/test release gate stabilized and passing.

## P1 High Priority

- [x] Route-level admin role checks are enforced.
- [x] Media upload guardrails (MIME/size/input constraints) are enforced.
- [x] Media lifecycle delete flow supports dependency preview + R2 delete.
- [x] Team/Gallery admin flows support upload integration.
- [x] Contact submission no longer silently succeeds without persistence.
- [ ] V-Vault launch mode decision finalized (`VAULT_SUBMISSIONS_ENABLED` default + SOP).

## P2 Operational Hardening

- [x] Admin page load failures have structured logging + operator-facing alerts.
- [x] Proxy verification cache has bounded pruning and cache-size metrics hooks.
- [x] Documentation synchronized and linked to this canonical checklist.

## Admin UX and Activation

- [x] Admin shell/dashboard underwent major UI/UX refresh.
- [x] Desktop `Upload` action and mobile `+` action are active.
- [x] Admin registration route/UI/API are active and linked from sign-in/dashboard.

## Launch Decision

Production admin launch is ready from an engineering perspective, pending only the product/ops decision for V-Vault enabled vs paused mode.

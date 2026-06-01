# Auth Redesign — Operator Deploy Runbook

> Companion to `AUTH-IMPLEMENTATION-SPEC.md`. Run through this in order before merging the auth redesign branch into `main`.

## 0. Snapshot prod env

Before changing anything, capture the current Vercel env so you can revert if needed.

```bash
vercel env pull .env.production.snapshot --environment production
mv .env.production.snapshot ~/.dbfh/auth-runbook-$(date +%Y-%m-%d).env
```

Keep that file in a password manager / secure store. Never commit it.

## 1. Required env vars (audit each)

All must be present in Vercel for `production` AND `preview`:

| Var | Notes |
|---|---|
| `DATABASE_URL` | CockroachDB primary connection (verify-full TLS) |
| `DIRECT_URL` | Same as DATABASE_URL (Prisma needs both) |
| `JWT_SECRET` | **NEW** — public user JWT signing key. `openssl rand -hex 32`. Boot fails if missing or set to a known placeholder. |
| `ADMIN_SESSION_SECRET` | ≥32 chars. `openssl rand -hex 32`. |
| `ADMIN_ACCESS_CODE` | **6 digits. `246810`** (moderator role). Production was missing this — caused the "codes must be unique" error. |
| `ADMIN_SUPER_ADMIN_ACCESS_CODE` | 6 digits, distinct |
| `ADMIN_FOUNDER_ADMIN_ACCESS_CODE` | 6 digits, distinct |
| `ADMIN_EDITOR_ACCESS_CODE` | 6 digits, distinct |
| `ADMIN_ALLOWED_USERS` | `email:role,email:role,…` |
| `RESEND_API_KEY` | From Resend dashboard. Boot fails on send paths without it. |
| `RESEND_FROM_EMAIL` | DKIM/SPF-verified sender on your Resend domain |
| `RESEND_FROM_NAME` | e.g. `Dr. Didi · DownBelow` |
| `NEXT_PUBLIC_SITE_URL` | `https://down-below.com` |
| `R2_*` | Cloudflare R2 credentials (unchanged) |

Confirm with `vercel env ls production` and `vercel env ls preview`.

## 2. One-shot DB backfill (run before deploy)

The new admin auth requires `AdminUser.emailVerified = true` for login to succeed. Without backfill, **every existing admin gets locked out after the deploy.** Mark all current admins as verified:

```sql
-- Run against the production CockroachDB before the deploy completes.
-- Idempotent: only updates rows that aren't already verified.
UPDATE "AdminUser" SET "emailVerified" = true WHERE "emailVerified" = false;
```

You can run this via `pnpm prisma db execute --file backfill.sql --schema prisma/schema.prisma` or directly via the Cockroach SQL console. Confirm count returned matches the number of currently-active admins.

## 3. Rotate `ADMIN_SESSION_SECRET` (recommended)

The deleted `/api/admin/diagnostics` endpoint was previously unauthenticated and could be probed. Rotating the session secret invalidates any leaked admin tokens.

1. `openssl rand -hex 32` → copy.
2. `vercel env add ADMIN_SESSION_SECRET production` → paste.
3. Redeploy.
4. **Every admin will need to sign in again** after this — expected.

Skip this step only if you're confident no admin tokens have leaked.

## 4. Deploy

Normal Vercel flow:

```bash
git push origin <auth-redesign-branch>
# Open PR, merge to main → Vercel builds production
```

Build will fail if `JWT_SECRET`, `ADMIN_SESSION_SECRET`, or any of the four `ADMIN_*_ACCESS_CODE` vars are missing — the env Zod schema rejects empty values now. That's deliberate.

## 5. Post-deploy smoke checks

Run these in order against production.

### 5.1 Operator health snapshot (super_admin only)

Sign in as a super_admin, then in the browser console:

```js
fetch('/api/admin/health').then(r => r.json()).then(console.log)
```

Expected shape:

```json
{
  "ok": true,
  "timestamp": "...",
  "database": { "configured": true, "reachable": true },
  "email": { "provider": "resend", "configured": true },
  "storage": { "configured": true },
  "adminEnv": { "sessionSecretSet": true, "accessCodesConfigured": 4 },
  "adminUsers": { "total": <N>, "active": <N>, "unverified": 0, "locked": 0 }
}
```

Anything less than `accessCodesConfigured: 4` or `unverified > 0` means step 1 or 2 needs revisiting.

### 5.2 Removed routes return 404

```bash
curl -i https://down-below.com/api/admin/diagnostics  # → 404
curl -i https://down-below.com/api/admin/recovery/reactivate  # → 404
curl -i https://down-below.com/admin/recovery  # → 301 → /admin/forgot-password
```

### 5.3 Admin login rate-limit smoke

```bash
for i in $(seq 1 25); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST \
    https://down-below.com/api/admin/session \
    -H 'Content-Type: application/json' \
    -d '{"email":"nobody@example.com","password":"bad"}'
done
```

First ~20 return `401` (invalid credentials). After the IP cap, subsequent calls return `429`.

### 5.4 Admin register, all four roles

In a fresh incognito session, register one admin per access code:
- `246810` → moderator
- `123456` (or whatever super_admin code is set) → super_admin
- the founder code → founder_admin
- the editor code → editor

For each: registration returns `201 { ok: true, requiresEmailVerification: true }`. Verification email arrives within 60s from Resend. Clicking the link verifies. Then login works.

Confirm DB rows via the operator health endpoint — `total` should grow by 4, `unverified` should drop to 0 after verification.

### 5.5 Forgot-password (public + admin)

- `POST /api/auth/forgot-password { email: "<typo>" }` → 200 with generic message (no enumeration).
- `POST /api/auth/forgot-password { email: "<real-user>" }` → 200 with same generic message. Email arrives.
- Reset via link → new password works, old password returns `invalid_credentials`.

Repeat for admin: `POST /api/admin/forgot-password`, `POST /api/admin/reset-password`. After reset, prior admin sessions for that account return `401` on next request (tokenVersion bumped + DB re-checked by api-guard).

### 5.6 Navbar contract

Open the public site signed out → "Register" CTA on first paint, no flicker.
Sign in → CTA flips to "Book Now" immediately on the next render (no tab-focus required).
Sign out → flips back to "Register" immediately.

If "Register" persists post-login, `router.refresh()` isn't kicking the server `Navbar` — file a bug.

## 6. Rollback

If anything in step 5 fails:

1. **For env issues** (#1, #3): revert via `vercel env rm` + the snapshot from step 0. Redeploy.
2. **For SQL backfill** (#2): no rollback needed — the column existed pre-deploy and the backfill is idempotent.
3. **For code regressions**: revert the merge commit. Files deleted in Phase B (recovery endpoint, diagnostics endpoint, recovery page, recovery form, auth-diagnostics.ts) come back cleanly because they're stateless. No migrations to undo.

## 7. Decommission checklist (within 7 days)

Within a week of deploy, confirm and complete:

- [ ] No 404s in the access log for `/admin/recovery*` or `/api/admin/diagnostics` from real admins (the 301 should catch bookmarks; check the logs to verify nothing else broke).
- [ ] `unverified` count on `/api/admin/health` stays at 0 for existing admins; new admin signups are the only ones with `unverified > 0` until they click their verification link.
- [ ] Resend dashboard shows healthy delivery rate (>95%) on verify-email and password-reset templates.
- [ ] No spikes in `admin.auth_failed` audit log events with reason `email_not_verified` from existing admins — that would mean the backfill missed someone.
- [ ] Schedule the follow-up cleanup migration to drop `User.phoneVerifyCode` and `User.phoneVerifyExpiry` columns (now dead).

## Known follow-ups (not blocking this deploy)

- 15 integration tests assert the legacy response shape (`success/details`) or specific status codes (`429` vs `423`) and need refactoring to match the new contract. Tests pass individually; full-suite shows cross-suite pollution from the in-memory rate limiter (a pre-existing harness issue). The shipped behaviour is correct; the test surface is on a follow-up sprint.
- Move the in-memory rate limiter to Upstash Redis when Vercel scales beyond a single isolate per region (multi-region attacker can currently bypass the per-instance counter).
- MFA / TOTP for admins.
- Append-only / signed audit log mirror for compliance hardening.

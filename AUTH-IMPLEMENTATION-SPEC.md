# DownBelow Auth — Implementation Spec

## Context

This plan replaces ad-hoc auth fixes with a coherent, implementable spec covering: (a) closing the four critical security gaps surfaced during tonight's review, (b) standardising on **Resend** as the single mail provider and removing the SMS/phone-OTP path entirely, (c) enforcing **email verification on both public users and admins**, and (d) standardising the moderator-role access code at **246810** so all four admin roles actually register end-to-end.

Three items the May 2026 audit docs marked "FIXED" / "Production-Ready" are still wide open in code: admin login rate-limiting, admin session revocation, and the diagnostics POST being unauthenticated. Those are folded into the phases below.

---

## What changes

### Behaviour changes
1. Public registration creates accounts with `emailVerified: false` and sends a Resend verification email. Login is blocked until verified.
2. Admin registration also creates accounts with `emailVerified: false`. The admin must click the Resend verification link before login succeeds.
3. **Phone-OTP password reset is removed** for both public and admin flows. Password reset is email-only via Resend.
4. Admin moderator role is registerable: `ADMIN_ACCESS_CODE=246810` becomes the standard value; documented in `.env.example`.
5. Admin login (`POST /api/admin/session`) gets the same IP + identity rate-limiting as registration, plus per-account lockout.
6. `POST /api/admin/diagnostics` requires an authenticated admin session.
7. `JWT_SECRET` is validated at boot; missing/placeholder values throw.

### Code changes (one line per area)
- New: `src/lib/email/` (Resend client, templates, send helpers)
- Modify: `src/lib/env.ts`, `src/lib/auth/session.ts`, `src/lib/admin/session.ts`, `src/lib/admin/user-repository.ts`, `src/lib/admin/repository.ts`, `src/lib/admin/auth-diagnostics.ts`
- Modify: `src/app/api/auth/register/route.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/verify-email/route.ts`, `src/app/api/auth/reset-password/route.ts`
- Modify: `src/app/api/admin/register/route.ts`, `src/app/api/admin/session/route.ts`, `src/app/api/admin/diagnostics/route.ts`, `src/app/api/admin/recovery/reactivate/route.ts`
- New: `src/app/api/admin/verify-email/route.ts`, `src/app/api/admin/password-reset/route.ts`, `src/app/api/admin/change-password/route.ts`
- New UI: `src/app/(auth)/verify-email/page.tsx`, `src/app/admin/verify-email/page.tsx`
- Remove: `src/app/api/auth/request-phone-reset/route.ts`, `src/app/api/auth/verify-phone-code/route.ts`, all `Math.random()` OTP code paths in `src/lib/admin/user-repository.ts`
- Migration: add email-verification + lockout columns to `AdminUser`

---

## Phase 1 — Resend integration & env hardening

### 1.1 Install + client
- `pnpm add resend`
- Create `src/lib/email/client.ts` exporting a `Resend` instance using `env.RESEND_API_KEY`.
- Create `src/lib/email/send.ts` with a typed `sendEmail({ to, subject, react })` wrapper that catches Resend errors, logs them, and returns `{ ok, id?, error? }` — never throws into the handler.

### 1.2 Env validation
Edit `src/lib/env.ts`:
- Add to `envSchema`:
  - `JWT_SECRET: z.string().trim().min(32, 'JWT_SECRET must be at least 32 characters')`
  - `RESEND_API_KEY: z.string().trim().min(10, 'RESEND_API_KEY is required')`
  - `RESEND_FROM_EMAIL: z.string().email().default('no-reply@down-below.com')`
  - `RESEND_FROM_NAME: z.string().trim().default('Dr. Didi · DownBelow')`
- Add `'dev-secret-change-in-production'` to `KNOWN_INSECURE_SECRETS`.
- Export `hasEmailProvider()`.

### 1.3 Replace JWT_SECRET fallback (closes C1)
Edit `src/lib/auth/session.ts` to read from validated `env.JWT_SECRET` instead of `process.env.JWT_SECRET || 'dev-...'`.

---

## Phase 2 — Email templates (all required)

Create as React components under `src/lib/email/templates/`. Render with `@react-email/render` (Resend's standard). Keep templates simple, brand-consistent, no JS.

| Template | Trigger | Audience |
|---|---|---|
| `VerifyEmail` | New public registration | User |
| `VerifyAdminEmail` | New admin registration | Admin |
| `PasswordReset` | User password reset request | User |
| `AdminPasswordReset` | Admin password reset request | Admin |
| `WelcomeUser` | After user email verification | User |
| `WelcomeAdmin` | After admin email verification | Admin |
| `PasswordChanged` | After password change/reset | Both |
| `AdminAccountReactivated` | After recovery flow | Admin |
| `LoginAlert` *(optional, defer)* | First login from new device/IP | Both |

Each template takes `{ recipientName, actionUrl, expiresInMinutes, supportEmail }` plus template-specific props. Action URLs built from `env.NEXT_PUBLIC_SITE_URL`.

---

## Phase 3 — Public user email verification (closes C2, removes SMS)

### 3.1 Registration
Edit `src/lib/admin/user-repository.ts` (the `User` create call):
- Change `emailVerified: true` → `emailVerified: false`.
- Generate `emailVerifyToken` via `crypto.randomBytes(32).toString('hex')` and `emailVerifyTokenExpiry = now + 24h`.
- After the DB write, send `VerifyEmail` via Resend with `${SITE_URL}/auth/verify-email?token=${token}`.

### 3.2 Login enforcement
Edit `src/app/api/auth/login/route.ts`:
- If credentials valid but `user.emailVerified === false`, return 403 `{ error: 'Email not verified', resend: true }`. Don't create session.
- Add `POST /api/auth/resend-verification` (3/hr per email + 10/hr per IP) that regenerates and re-sends.

### 3.3 Password reset — email only
- Keep `src/app/api/auth/reset-password/route.ts` flow but switch transport to Resend.
- **Delete** `src/app/api/auth/request-phone-reset/route.ts` and `src/app/api/auth/verify-phone-code/route.ts`.
- **Delete** `generatePhoneVerificationCode`, `verifyPhoneCode`, all `phoneVerify*` code in `src/lib/admin/user-repository.ts` (closes H1).
- Stop returning OTPs in HTTP bodies anywhere.
- Schema: leave `phoneVerifyCode`/`phoneVerifyExpiry` columns nullable & unused for now (defer drop to a follow-up migration to keep this deploy safe).

### 3.4 Token-storage hardening (closes M2)
Hash `resetToken` (sha256) before DB storage. Plaintext only in the email. Verification compares hash.

---

## Phase 4 — Admin email verification (new)

### 4.1 Schema migration
Add to `model AdminUser` in `prisma/schema.prisma`:
```prisma
emailVerified          Boolean   @default(false)
emailVerifyToken       String?   @unique
emailVerifyTokenExpiry DateTime?
resetToken             String?   @unique
resetTokenExpiry       DateTime?
failedLoginAttempts    Int       @default(0)
lockoutUntil           DateTime?
tokenVersion           Int       @default(0)
```
Run: `pnpm prisma migrate dev --name admin_email_verification_and_lockout`. Backfill existing admins → `emailVerified: true`.

### 4.2 Admin registration
- Edit `registerAdminUserAccount` in `src/lib/admin/repository.ts`: generate token, set `emailVerified: false`, send `VerifyAdminEmail`.
- Edit `src/app/api/admin/register/route.ts`: don't set the session cookie on success; return `{ success: true, requiresEmailVerification: true }`.

### 4.3 Admin verify-email endpoint
Create `src/app/api/admin/verify-email/route.ts`: POST `{ token }` → find AdminUser by token, check expiry, set `emailVerified: true`, clear token, audit log, send `WelcomeAdmin`.

### 4.4 Admin login enforcement
Edit `authenticateAdminUserWithDiagnostics` in `src/lib/admin/auth-diagnostics.ts`: after credential pass, refuse if `!emailVerified` with reason `email_not_verified`.

### 4.5 Admin password change + reset
- Create `src/app/api/admin/change-password/route.ts`: authenticated, `{ currentPassword, newPassword }`, increments `tokenVersion`, sends `PasswordChanged`, audit log.
- Create `src/app/api/admin/password-reset/route.ts`: two-step (request → token email; confirm → set new password). Hashed reset tokens.
- Tighten `src/app/api/admin/recovery/reactivate/route.ts` to also require the email-token step, not just the role access code.

---

## Phase 5 — Admin session hardening

### 5.1 Rate-limit admin login (closes C3)
Edit `src/app/api/admin/session/route.ts` — mirror `register/route.ts`:
```ts
const adminLoginIpLimiter = createRateLimiter({ windowMs: 15*60*1000, limit: 20 })
const adminLoginIdentityLimiter = createRateLimiter({ windowMs: 15*60*1000, limit: 5 })
```
IP cap before body parse, identity cap after email is known. Return 429 with `Retry-After`.

### 5.2 Account lockout on AdminUser
In `authenticateAdminUserWithDiagnostics`:
- On wrong password: `failedLoginAttempts += 1`. If ≥ 5, set `lockoutUntil = now + 30min`, clear counter on next successful login.
- If `lockoutUntil > now`: refuse with reason `account_locked`.

### 5.3 Admin session revocation (closes H2)
Edit `verifyAdminSession` in `src/lib/admin/session.ts`:
- After signature/expiry pass, fetch `AdminUser` by email (one indexed lookup).
- Reject if `!isActive`, `tokenVersion !== payload.tokenVersion`, or `!emailVerified`.
- Embed `tokenVersion` in `createAdminSessionToken` payload.

### 5.4 Lock down diagnostics POST (closes C4)
Edit `src/app/api/admin/diagnostics/route.ts`:
- Add `requireAdminSession` check at top of POST.
- Remove `skipLogging` parameter entirely.
- Optionally gate behind `env.NODE_ENV !== 'production'`.

### 5.5 Cookie hardening (closes H4 + H5)
- Admin cookie `sameSite: 'lax'` → `'strict'`.
- All cookies: `secure: env.NODE_ENV === 'production'` → `secure: env.NODE_ENV !== 'development'` (default-secure for staging/preview).

---

## Phase 6 — Standardise the moderator access code (246810)

### 6.1 Why it currently fails
In `src/lib/admin/session.ts` `resolveAdminRegistrationRole`, the `moderator` entry is filtered out when `ADMIN_ACCESS_CODE` is empty. The shipped `.env.example` has `ADMIN_ACCESS_CODE=` (empty), so no one can register as moderator — any attempt to use a moderator code returns 401 "Admin registration denied".

### 6.2 Fix
- Set `ADMIN_ACCESS_CODE=246810` in `.env.example` and prod/staging env vars.
- Promote `ADMIN_ACCESS_CODE` from optional to required (6-digit) in `src/lib/env.ts`.
- Add integration test that registers one admin per role (moderator/editor/founder_admin/super_admin) using all four codes, asserts each AdminUser row created with the right role.

### 6.3 Uniqueness guard
Already enforced in `src/lib/env.ts` (codes must be unique). `246810` does not collide with `123456 / 234567 / 345678`.

---

## .env.example — final contents

```
NEXT_PUBLIC_SITE_URL=https://down-below.com

# CockroachDB
DATABASE_URL=postgresql://username:password@host:26257/down_below?sslmode=verify-full&connect_timeout=60
DIRECT_URL=postgresql://username:password@host:26257/down_below?sslmode=verify-full&connect_timeout=60

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET=down-below-assets
R2_PUBLIC_URL=https://pub-your-public-bucket-id.r2.dev

# Public user sessions — REQUIRED. Generate with: openssl rand -hex 32
JWT_SECRET=replace-with-32-byte-random-hex-secret

# Admin access foundation
ADMIN_SESSION_SECRET=replace-with-a-long-random-secret-at-least-32-characters
ADMIN_ACCESS_CODE=246810
ADMIN_SUPER_ADMIN_ACCESS_CODE=123456
ADMIN_FOUNDER_ADMIN_ACCESS_CODE=234567
ADMIN_EDITOR_ACCESS_CODE=345678
ADMIN_SUPPORT_PHONE=+2348012345678
ADMIN_ALLOWED_USERS=admin@down-below.com:super_admin,editor@down-below.com:editor

# Email (Resend) — REQUIRED for verification, password reset, notifications
RESEND_API_KEY=re_replace_with_real_key
RESEND_FROM_EMAIL=no-reply@down-below.com
RESEND_FROM_NAME=Dr. Didi · DownBelow

# Public V-Vault submissions
VAULT_SUBMISSIONS_ENABLED=false
```

---

## Suggested execution order

1. **Phase 1** — env hardening + Resend client.
2. **Phase 5.4 / 5.5** — diagnostics POST auth + cookie hardening (closes C4, H4, H5).
3. **Phase 5.1 / 5.2** — admin login rate-limit + lockout (closes C3, includes migration).
4. **Phase 6** — moderator access code 246810 + integration test.
5. **Phase 2** — email templates.
6. **Phase 3** — public email verification + remove SMS.
7. **Phase 4** — admin email verification + change-password.
8. **Phase 5.3** — admin session revocation via tokenVersion.

---

## Verification

1. **Boot** — start with `JWT_SECRET` unset → process exits with `[env]` error. Same for `RESEND_API_KEY`, `ADMIN_ACCESS_CODE`.
2. **User email flow** — register → DB `emailVerified: false`; email arrives; click verifies; login succeeds.
3. **Admin email flow** — register with each of `246810 / 123456 / 234567 / 345678` → AdminUser with correct role, `emailVerified: false`; email arrives; verifies; login succeeds.
4. **Rate limit** — 21 bad logins from one IP → 429.
5. **Lockout** — 5 bad attempts for one email → 6th returns `account_locked`.
6. **Diagnostics** — `POST /api/admin/diagnostics` unauthenticated → 401.
7. **Cookie attrs** — Set-Cookie in staging → `Secure; SameSite=Strict; HttpOnly`.
8. **Revocation** — login as admin A; deactivate A elsewhere; A's next request → 401.
9. **Password reset** — request → email → reset → old password fails → `PasswordChanged` email arrives.

---

## Out of scope (deferred)

- MFA / TOTP for admins.
- Append-only / signed audit log.
- Migrating in-memory rate limiter to Redis/Upstash.
- OAuth / social login.
- `LoginAlert` template.

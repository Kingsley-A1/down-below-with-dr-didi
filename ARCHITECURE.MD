# Down Below Platform Architecture (ARCHITECURE)

## 1. Purpose

This document is the technical map of the entire platform. It is designed so a new engineer, reviewer, or operator can understand:

- What the system does
- How each major module fits together
- Where core logic lives in code
- How data flows through the app
- How to run, test, and operate it safely

Repository root: `down-below-with-dr-didi`

---

## 2. Product Context

Down Below Family  Health Initiatives is a content and operations platform with two major surfaces:

1. Public website
- Health education content
- Outreach storytelling
- Podcast pages
- Contact and vault submission flows

2. Admin control plane
- Site settings and alerts
- Media upload and management
- Team, gallery, podcast, and user operations
- Vault moderation and response workflows

Core goal: provide a trusted public experience while giving operators a secure admin workspace for content governance and patient-safe operations.

---

## 3. Technology Stack

### 3.1 Application
- Framework: Next.js 16 (App Router)
- Language: TypeScript (strict)
- Runtime split:
  - Route handlers and server components for server-side logic
  - Client components for interactive admin/public UI

### 3.2 UI and Forms
- Styling: Tailwind CSS v4 + design tokens in global CSS
- Forms: React Hook Form + Zod
- Icons: Lucide React

### 3.3 Data and Persistence
- ORM: Prisma
- Database: CockroachDB (PostgreSQL wire-compatible)
- Migrations: Prisma migrations under `prisma/migrations`

### 3.4 Storage
- Object storage: Cloudflare R2
- Metadata for uploaded assets stored in database `MediaAsset`

### 3.5 Testing and Quality
- Unit/integration: Jest
- Type safety gate: `pnpm exec tsc --noEmit`
- Release check: `pnpm run verify:release`

---

## 4. Repository Layout

Top-level architecture-relevant folders:

- `src/app/`
  - Next.js routes, pages, layouts, route handlers
- `src/components/`
  - Reusable UI modules for admin/public/auth
- `src/lib/`
  - Shared services (env, prisma, auth, admin repositories, security)
- `src/data/`
  - Static data fallbacks and seed-aligned helpers
- `prisma/`
  - Prisma schema and migrations
- `public/`
  - Static files and service worker
- `src/__tests__/`
  - Unit and integration tests

---

## 5. Request Flow Overview

### 5.1 Public Request Path

1. User opens a public route (`/`, `/about`, `/vault`, etc.)
2. App Router resolves server + client components
3. Optional API fetches pull dynamic content
4. Response is streamed/hydrated to the browser

### 5.2 Admin Request Path

1. User opens an admin route (`/admin/*`)
2. Proxy/middleware and page guards enforce session checks
3. Admin layout loads shell and navigation when authenticated
4. Admin modules call authenticated API handlers for CRUD operations

### 5.3 API Handler Pattern

Most route handlers follow this shape:

1. Validate environment availability (`hasDatabaseConfig`, etc.)
2. Authenticate/authorize if admin endpoint
3. Validate payload with Zod
4. Execute repository logic through Prisma
5. Return normalized JSON response and status

---

## 6. Routing and Surface Areas

### 6.1 Public Pages

Representative routes:
- `/`
- `/about`
- `/library`
- `/podcast`
- `/gallery`
- `/outreach`
- `/contact`
- `/vault`

### 6.2 Auth Pages

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify-email`

### 6.3 Admin Pages

- `/admin`
- `/admin/sign-in`
- `/admin/register`
- `/admin/settings`
- `/admin/media`
- `/admin/alerts`
- `/admin/team`
- `/admin/gallery`
- `/admin/podcast`
- `/admin/users`
- `/admin/vault`

### 6.4 API Groups

- Public APIs: under `src/app/api/*` (contact, vault, alerts active, auth)
- Admin APIs: under `src/app/api/admin/*`

---

## 7. Authentication and Authorization

### 7.1 Admin Session Model

Admin auth is cookie-session based.

- Cookie: `dbfh_admin_session`
- Session creation: `POST /api/admin/session`
- Session deletion: `DELETE /api/admin/session`
- Session helpers: `src/lib/admin/session.ts`

Admin registration uses role-specific access codes and credentials:

- Endpoint: `POST /api/admin/register`
- Payload includes name, email, phone, password, role access code
- Role code resolution: `resolveAdminRegistrationRole(...)`

### 7.2 RBAC

Admin roles include:
- `super_admin`
- `founder_admin`
- `editor`
- (legacy/moderation paths may still exist in historical code)

Authorization policy helper:
- `src/lib/admin/rbac.ts`

### 7.3 Public/User Auth

User authentication for public/member flows is separate from admin auth.

---

## 8. Data Model (High-Level)

Defined in `prisma/schema.prisma`.

Key models:

- `AdminUser`
  - admin identity and credential fields (`email`, `passwordHash`, `phone`, role, status)
- `User`
  - platform member account model
- `SiteSettings`
  - global content configuration
- `SiteAlert`
  - ticker/notice content and schedule
- `MediaAsset`
  - uploaded object metadata
- `AuditLog`
  - admin action logging
- `VaultSubmission`
  - vault questions
- `VaultResponse`
  - admin responses to vault submissions
- `VaultSubmissionEvent`
  - event timeline for moderation and notifications
- `UserNotification`
  - user-facing events/alerts

Migration source of truth:
- `prisma/migrations/*`

---

## 9. Media Upload Architecture

### 9.1 UX Layer

Primary modal component:
- `src/components/admin/AdminUploadModal.tsx`

The modal now captures:
- File
- Label
- Alt text
- Media kind intent (image/audio/video/document/other)
- Destination intent (media library, settings, team, gallery, podcast)

### 9.2 Client Upload Adapter

- `src/components/admin/media-upload.ts`
- Uses `FormData` and posts to `/api/admin/media`

### 9.3 Server Pipeline

1. Validate request/auth
2. Validate file type and size
3. Upload object to R2
4. Persist `MediaAsset` metadata in DB
5. Return asset payload to UI

---

## 10. Admin UI Shell Architecture

Primary shell:
- `src/components/admin/AdminShell.tsx`

Responsibilities:
- Sticky admin header
- Route-aware navigation state
- Mobile overlay navigation
- Desktop collapsible sidebar
- Upload trigger actions (desktop `Upload`, mobile `+`)
- Centralized mount for `AdminUploadModal`

Recent UX behavior:
- Header no longer displays admin email
- Sign-out removed from header and available in nav panel
- Hamburger/menu icon has transparent background styling

---

## 11. Content and Operations Modules

Modules are implemented as page + component + API repository patterns.

Examples:

- Settings module
  - pages under `src/app/admin/settings`
  - repository operations in `src/lib/admin/repository.ts`
- Alerts module
  - pages under `src/app/admin/alerts`
  - APIs under `src/app/api/admin/alerts/*`
- Team/Gallery/Podcast modules
  - admin pages + route handlers + media dependencies
- Users module
  - activation/deactivation and audit-aware actions
- Vault module
  - moderation, response creation, notification dispatch

---

## 12. Reliability and Safety Patterns

### 12.1 Validation

- Zod validation at API boundaries
- Defensive content-type checks in fetch consumers

### 12.2 Database Availability Fallbacks

- Certain public APIs provide graceful fallbacks when DB is unavailable
- Admin APIs return explicit 503 where persistence is required

### 12.3 Audit and Event Trails

- `writeAuditLog(...)` records admin actions
- Vault workflows also generate submission events and user notifications

### 12.4 Prisma Runtime Drift Handling

Prisma schema can be ahead of a stale runtime client during hot-reload.

Current mitigation in admin registration repository logic:
- Tries write with `phone` when supported
- If runtime client throws unknown argument for `phone`, retries without it

Operational recommendation:
- Run `pnpm db:generate`
- Restart dev server
- Clear `.next` cache when needed

---

## 13. Environment and Configuration

Environment parser:
- `src/lib/env.ts`

Key variables:
- `DATABASE_URL`, `DIRECT_URL`
- `ADMIN_SESSION_SECRET`
- `ADMIN_SUPER_ADMIN_ACCESS_CODE`
- `ADMIN_FOUNDER_ADMIN_ACCESS_CODE`
- `ADMIN_EDITOR_ACCESS_CODE`
- `ADMIN_SUPPORT_PHONE`
- R2 variables (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, etc.)

Admin env rules:
- Session secret minimum length enforced
- Role codes must be six digits and unique

---

## 14. Build, Test, and Release

Core commands:

```bash
pnpm install
pnpm dev
pnpm exec tsc --noEmit
pnpm test
pnpm run verify:release
pnpm db:generate
pnpm db:migrate
pnpm db:deploy
```

Typical release gate:
1. Type-check passes
2. Jest suite passes
3. Migrations are deployable
4. App builds cleanly

---

## 15. Security and Access Controls

- Admin APIs require authenticated admin session
- RBAC checks for sensitive operations
- Rate limiters on sensitive auth/register endpoints
- Cookie settings enforce secure/httpOnly semantics in production
- Minimal exposure of identity data in vault contexts based on role policy

---

## 16. Performance Considerations

- Tailwind utility-first CSS with scoped components
- Next.js server component rendering where appropriate
- Connection pool tuning in Prisma client adapter
- Selective no-store and dynamic routing where freshness is critical

---

## 17. Known Architectural Risks and Mitigations

1. Legacy/admin auth overlap risk
- Risk: old and new admin auth pathways can diverge
- Mitigation: continue consolidating all admin endpoints on `dbfh_admin_session`

2. Schema/client drift in local dev
- Risk: runtime unknown argument errors
- Mitigation: generate client in lifecycle scripts + fallback guard in repository + restart strategy

3. Large unbatched change sets in source control
- Risk: difficult rollback and review
- Mitigation: enforce conventional commits by module batch

---

## 18. Extension Guide (How to Add a New Admin Module)

1. Add page route in `src/app/admin/<module>/page.tsx`
2. Add sidebar link in `AdminShell` nav sections
3. Add API route handlers in `src/app/api/admin/<module>/*`
4. Add repository functions in `src/lib/admin/repository.ts`
5. Add Zod schemas in `src/lib/validations.ts`
6. Add integration tests under `src/__tests__/integration`
7. Add audit log entries for state-changing actions

---

## 19. Operational Runbook (Quick)

If admin route fails unexpectedly:

1. Check env validity in `src/lib/env.ts` expectations
2. Run `pnpm db:generate`
3. Run `pnpm exec tsc --noEmit`
4. Run targeted integration tests for affected feature
5. Restart dev server and re-open `/admin/sign-in` and `/admin/register`

If upload pipeline fails:

1. Verify R2 env vars
2. Check `/api/admin/media` response payload and status
3. Confirm DB write to `MediaAsset`

---

## 20. Final Notes

This architecture intentionally combines:
- Product-facing clarity for the health initiative mission
- Operational rigor for admin workflows
- Safety-first patterns for auth, moderation, and data handling

Use this file as the onboarding baseline and keep it updated whenever:
- Auth or RBAC changes
- Data models change
- API contracts or admin workflows change
- Deployment or release process changes

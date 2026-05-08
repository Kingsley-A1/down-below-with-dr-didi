# Down Below Family Health Initiative with Dr. Didi

> Execution-focused production plan for moving the current Next.js codebase into an operational platform at `down-below.com.ng`.

## 0. Current Execution Snapshot

This document is no longer just a roadmap. It is the live execution reference for what is already in place, what is now unblocked because infrastructure credentials exist, what still blocks production, and what the team should focus on next.

### Current state as of May 2026

- The public Next.js application is already running on the existing App Router codebase.
- A first-pass production foundation has already been scaffolded in code.
- CockroachDB connection values are now available in the local environment.
- Cloudflare R2 connection values are now available in the local environment.
- Admin session secrets and allowed users are now available in the local environment.
- The site now has a first-pass admin shell, settings layer, and media upload foundation.
- The homepage hero and public contact surfaces have already been wired to the managed site settings layer.

### What changed because credentials are now available

The project is no longer blocked on infrastructure setup. The center of gravity moves from planning and scaffolding into:

- installing the missing runtime and build dependencies
- generating the Prisma client
- running the first CockroachDB migration
- validating database-backed settings and media flows end-to-end
- shifting the remaining public pages from prototype content to managed content

### Operational truth

The project is now in the transition point between scaffolding and live system activation.

That means the current question is no longer, "What architecture should we use?" The current question is, "Which exact production flows must become real first so the current code stops behaving like a prototype?"

### Immediate focus now

1. Activate the installed foundation by completing dependency installation and database migration.
2. Validate the `site_settings` record lifecycle and seed baseline records.
3. Validate media upload to Cloudflare R2 and asset persistence to CockroachDB.
4. Finish turning public surfaces into database-backed and admin-managed experiences.
5. Replace prototype submission workflows with operational workflows for contact and V-Vault.

## 1. Product Direction

### Official Brand

- Primary name: **Down Below Family Health Initiative with Dr. Didi**
- Tagline: **Expose in Love, teach, heal, and win the world for God.**
- Motto: **Expose in Love, Teach, Heal, Win.**
- Primary production domain: `down-below.com.ng`

### Fixed Product Constraints

- Keep the current Next.js codebase and upgrade it incrementally.
- Keep the current colour system and overall design tone.
- Replace the current font system with a clean sans-serif system that feels modern, professional, and medically trustworthy.
- Use **CockroachDB** as the primary relational database.
- Use **Cloudflare R2** for media and downloadable asset storage.
- Do **not** depend on an email API for phase 1 production.
- Public contact must route through **WhatsApp** and the official **Gmail** address.
- The **V-Vault** page must use Dr. Didi's contact details and not depend on automated email delivery.
- Hero images and all editable assets must become admin-managed.

### Upgrade Goal

Move the current prototype from static demo content to a production-ready platform with:

- managed content
- managed assets
- admin workflows
- secure data storage
- production operations
- moderation and governance
- clear launch readiness criteria

## 2. Current Build Status

### What already exists in code

- Public pages for home, about, library, outreach, vault, and contact
- A working Next.js 16 App Router foundation
- Existing design tokens and colour palette
- Shared zod validation for public forms
- Environment parsing and configuration helpers
- Prisma schema scaffold for CockroachDB
- Prisma seed scaffold
- R2 storage helper and upload pipeline scaffold
- Admin session and RBAC foundation
- Admin shell, sign-in, settings, dashboard, and media library pages
- Public settings access path for homepage and contact surfaces

### What is now partially productionized

- Site settings exist as a modeled persistence layer
- Media assets exist as a modeled persistence layer
- Homepage hero now reads from managed settings
- Contact page public channels now read from managed settings
- Contact form success messaging is now aligned with WhatsApp and Gmail follow-up instead of email confirmation language

### What still behaves like a prototype

- The rest of the public content model is still file-based or hardcoded
- Library and outreach content still need production publishing workflows
- V-Vault still needs database-backed moderation workflow activation
- Contact and V-Vault operational tracking are not yet implemented
- Admin shell exists, but deeper modules such as FAQ, articles, outreach, and moderation are not yet delivered
- Analytics, monitoring, and rollback procedures are not yet in place

## 3. Infrastructure Readiness

### Infrastructure now available

The local environment now contains values for:

- canonical/public site URL configuration
- CockroachDB connection
- CockroachDB direct connection
- Cloudflare R2 account and bucket configuration
- R2 public asset base URL
- admin session secret
- admin access code
- allowed admin users

### Infrastructure implications

Because these values now exist, the following work can and should happen immediately:

- install Prisma and AWS SDK dependencies into the workspace
- generate Prisma client code
- create the first migration history in the repo
- apply CockroachDB schema to the target cluster
- seed baseline site settings and allowed admin users
- validate the admin settings and media flows against real infrastructure

### Configuration issues already visible

These must be resolved or explicitly accepted during activation:

- The public site URL should resolve to one canonical URL string, not a comma-separated list.
- The admin access code currently needs to stay aligned with the validation rule enforced by the application.
- The project still needs a final decision on whether the Vercel preview URL should be treated as a fallback or only the production domain should be canonical.

### Canonical configuration direction

- Use `https://down-below.com.ng` as the canonical production URL.
- Treat any Vercel-hosted preview or fallback domain as non-canonical.
- Keep asset delivery on the R2 public URL until a stricter asset delivery policy becomes necessary.

## 4. Target Production Architecture

### Application Layer

- Keep the current Next.js application as the main codebase.
- Continue using App Router and TypeScript.
- Keep public page composition in the existing app structure while progressively replacing hardcoded content with settings-backed and database-backed content.

### Data Layer

- Use **CockroachDB** for structured application data.
- Use **Prisma** as the ORM and migration layer.
- Keep `site_settings` as the source of truth for global brand and contact data.
- Keep `media_assets` as the source of truth for reusable uploaded files.

### Storage Layer

- Use **Cloudflare R2** for:
  - hero images
  - article cover images
  - outreach gallery images
  - downloadable PDFs and guides
  - future media assets

### Admin Authentication

- Current implementation is a custom signed-cookie admin session with allowlisted users.
- This is acceptable as a phase-1 protected admin entry point.
- If the team later wants Google-based sign-in, that should be treated as an enhancement after the current admin workflows are stable.

### Hosting and Delivery

- Frontend and server routes: Vercel
- Domain: `down-below.com.ng`
- DNS and edge delivery: Cloudflare
- Media delivery: public R2 URL unless specific assets later require signed access

## 5. Production Data Model

These are the records the application should treat as first-class production entities.

### Already scaffolded in the Prisma schema

- `AdminUser`
- `SiteSettings`
- `MediaAsset`
- `AuditLog`
- `VaultSubmission`
- `Article`
- `OutreachEvent`

### Still planned but not yet modeled in the current schema

- `faq_items`
- `article_tags`
- `article_categories` if categories need relational control
- `navigation_items` if nav becomes fully editor-managed
- `contact_click_logs`
- `publish_revisions`
- `feature_flags`
- `team_members`

### Core settings that must remain in `site_settings`

- site name
- tagline
- motto
- canonical site URL
- primary WhatsApp link
- official Gmail address
- hero headline
- hero supporting text
- hero image URL or asset linkage
- hero image alt text
- footer blurb
- default SEO assumptions where global scope is appropriate

### Data-model focus now

The next data-model work should not sprawl. The immediate schema focus should be:

1. Get the existing schema migrated successfully.
2. Seed one global `site_settings` record.
3. Seed or upsert allowed admin users.
4. Validate `media_assets` writes from a real upload.
5. Only then expand into FAQ, revisions, and click tracking.

## 6. Admin Scope

The admin side is part of the production upgrade, not a later separate build.

### Already present in code

- Dashboard overview
- Site settings manager
- Media library
- Admin sign-in flow
- Protected admin route shell
- Audit log write path in repository helpers

### Still required to complete the admin backbone

- Homepage section editor beyond the hero settings already wired
- Library/article manager
- Outreach content manager
- FAQ manager
- V-Vault submission inbox
- Admin user management surface
- Audit log viewer UI

### Admin capabilities by module

#### Site settings manager

- Update site name, tagline, motto, and contact details
- Update global SEO defaults over time
- Update navbar and footer details indirectly through managed settings
- Set the active hero image URL or linked media record

#### Media library

- Upload, replace, and annotate assets
- Store files in R2 and metadata in CockroachDB
- Carry alt text into public rendering
- Prepare for future asset usage tracking

#### Homepage editor

- Extend beyond the current hero wiring
- Move stat cards, CTA text, proof sections, and featured content controls out of code

#### Library manager

- Create, edit, draft, publish, and unpublish articles
- Assign cover image, category, and SEO metadata
- Support rich text or structured blocks without reopening core page code

#### Outreach manager

- Update event summaries, impact metrics, and gallery assets
- Control publish state and ordering

#### V-Vault inbox

- Review new submissions
- Mark as reviewed, answered privately, approved for FAQ, or archived
- Add moderation notes
- Convert selected questions into public educational FAQs when appropriate

## 7. Public Experience Changes

### Already completed

- Homepage hero text is now managed through settings
- Homepage hero image is now settings-backed
- Contact page public Gmail and WhatsApp values are now settings-backed
- Contact success messaging is no longer tied to an automated email confirmation assumption

### Still required on the public site

- Connect footer contact details to the same managed settings source everywhere
- Shift remaining homepage sections into structured managed content
- Move About page content into admin-managed content or structured content records
- Move Library list and detail pages to database-backed article records
- Move Outreach page to database-backed outreach records
- Replace prototype V-Vault handling with a database-backed moderation workflow

### Brand and messaging updates

- Replace all legacy naming with **Down Below Family Health Initiative with Dr. Didi**
- Keep the approved tagline everywhere
- Keep the approved motto everywhere
- Ensure metadata, footer, public copy, and admin settings all stay aligned to one source of truth

### Typography update

- Move to a sans-forward typography system
- Preferred candidates remain:
  - **Manrope**
  - **DM Sans**
  - **General Sans** if licensing is approved
- Default recommendation remains **Manrope** for a single-family system

### Colour system

- Keep the existing colour tokens and visual identity
- Improve contrast, spacing, hierarchy, and type scale instead of rebranding the palette

## 8. Content and Asset Management Rules

All assets should become updateable without code edits.

### Assets that must be admin-managed

- homepage hero image
- logo variations
- OG image
- article cover images
- outreach gallery images
- downloadable guides and PDFs
- founder/profile images
- partner logos if used later

### Content that must become admin-managed or database-managed

- homepage content blocks
- about page content
- library articles
- outreach metrics and stories
- FAQ items
- footer and contact details
- SEO defaults and page metadata where appropriate

### Editorial workflow standard

- Draft
- Review
- Publish
- Archive

### Non-functional requirement

- Every published asset and content change must be reversible through revision history or explicit replacement logging.

## 9. Security, Compliance, and Privacy

### Required controls

- Server-side validation for all submission routes
- Rate limiting on V-Vault and contact-related actions
- CSRF and abuse protections where relevant
- Input sanitisation for rich content
- Role-based admin access
- Audit logging for admin actions
- Secure secrets handling for CockroachDB, R2, and auth

### Sensitive workflow rules

- Do not collect unnecessary personal health data on public forms.
- Keep V-Vault submissions minimal and purpose-specific.
- Add clear disclaimers that site content is educational and not emergency medical care.
- Add moderation workflow before any user-submitted question is published publicly.

### Immediate security follow-up

- Align the admin access code policy with the actual configured secret format.
- Confirm that `.env` is excluded from any accidental commits and never echoed in logs or reports.
- Add rate-limiting middleware or route-level guardrails before the V-Vault workflow is considered production-ready.

## 10. SEO, Analytics, and Operations

### SEO work

- Replace all default metadata with the final brand name and canonical domain.
- Use `down-below.com.ng` as the canonical URL base.
- Add structured metadata for articles and organization details.
- Generate sitemap and robots rules from live content.

### Analytics

- Add privacy-conscious analytics for:
  - page traffic
  - article reads
  - WhatsApp click-throughs
  - Gmail click-throughs
  - V-Vault submission conversions

### Monitoring

- Error tracking
- uptime monitoring
- admin audit logs
- storage usage monitoring for R2
- database usage monitoring for CockroachDB

### Operations focus now

Operations work should follow activation, not precede it. The next operational milestone is:

- migration succeeds
- seed succeeds
- admin settings read and write against CockroachDB succeed
- media upload succeeds against R2

Only after those are real should the team spend time on analytics and launch automation.

## 11. Delivery Plan in Order

This sequence is no longer theoretical. It is the implementation order that matches the current codebase state.

### Phase 0. Discovery and Freeze

Status: mostly complete

Completed or materially decided:

- official product name
- tagline and motto
- infrastructure choices
- no-email phase-1 constraint
- WhatsApp and Gmail public contact direction
- admin-managed hero requirement

Still to confirm cleanly:

- final public display format for WhatsApp and Gmail
- final typography choice
- canonical URL policy for preview vs production

### Phase 1. Foundation Hardening

Status: scaffolded in code, not fully activated

Completed in code:

- environment strategy scaffold
- database and storage integration scaffold
- admin session and RBAC scaffold
- migration and seed scripts in package manifest

Still required to complete activation:

- install packages
- generate Prisma client
- run first migration
- validate admin protection against real env

### Phase 2. Content Model and Admin Backbone

Status: partially complete

Completed in code:

- CockroachDB schema scaffold
- media upload pipeline scaffold
- admin shell and dashboard scaffold
- site settings manager scaffold
- media library scaffold
- audit log write path scaffold

Still required:

- validate CRUD against real database
- validate media upload to real R2 bucket
- ensure site settings save and re-render correctly

### Phase 3. Homepage and Global Content Migration

Status: started and partially complete

Completed:

- homepage hero connected to managed settings
- public contact channels connected to managed settings

Remaining:

- finish homepage section management beyond hero
- connect footer and any remaining public contact references
- apply final typography system
- complete metadata normalization around canonical URL

### Phase 4. Library and Outreach Productionization

Status: not started

Required focus:

- migrate articles off file-based content where appropriate
- migrate outreach content into database-backed records
- deliver publish workflow for editors

### Phase 5. Contact and V-Vault Operational Workflows

Status: not complete

Required focus:

- store V-Vault submissions in CockroachDB
- build moderation queue and review states into admin
- add contact and submission event logging
- remove any remaining prototype assumptions from public flows

### Phase 6. Production Readiness

Status: not started

Required focus:

- accessibility pass
- performance pass
- error tracking
- analytics integration
- backup and recovery documentation
- permission review

### Phase 7. UAT, Launch, and Handover

Status: future

Required focus:

- owner acceptance testing
- content QA
- deployment validation on production domain
- admin training
- handover runbook

## 12. What To Focus On Now

This is the practical focus stack, ordered by leverage.

### Focus 1. Activate persistence

- Install all missing dependencies.
- Generate Prisma client.
- Run and verify the first CockroachDB migration.
- Seed the initial `site_settings` and admin users.

### Focus 2. Prove the core admin loop

- Sign into admin.
- Save site settings.
- Upload a hero image.
- Confirm the homepage and contact page update from persisted data.

### Focus 3. Finish global managed content

- Move footer and remaining contact references to the settings layer.
- Move remaining homepage sections into managed content.
- Normalize metadata and canonical URL behavior.

### Focus 4. Replace prototype operational flows

- Rebuild V-Vault around stored submissions and moderation.
- Add direct-contact event logging.
- Remove any remaining fake-confirmation or prototype assumptions.

### Focus 5. Expand editorial control

- Articles
- Outreach events
- FAQ publishing
- moderation review surfaces

## 13. Suggested Acceptance Criteria By Current Milestone

### Infrastructure activation

- Prisma client generates successfully.
- CockroachDB schema migrates successfully.
- Seed runs successfully.
- Admin routes load without env validation failure.

### Admin settings milestone

- Global settings can be updated from admin and persist to CockroachDB.
- Homepage hero reflects saved settings without code edits.
- Contact page public channels reflect saved settings without code edits.

### Media milestone

- Asset upload succeeds to R2.
- Asset metadata persists in CockroachDB.
- Uploaded asset can be used as the hero image.

### Contact and V-Vault milestone

- WhatsApp and Gmail actions work correctly on mobile and desktop.
- V-Vault submissions are stored securely and appear in the admin moderation queue.

## 14. Known Blockers And Corrections

These are the real issues to correct during activation rather than hiding them inside later phases.

### Configuration alignment

- Ensure the canonical site URL env value is a single valid URL.
- Ensure admin access code policy and runtime validation match the chosen secret format.

### Product alignment

- Decide whether the current custom admin session approach is sufficient for phase 1 or whether Google sign-in must be introduced immediately.
- Decide whether articles remain hybrid for a short period or move directly into CockroachDB.

### Execution alignment

- Do not widen scope into analytics, SEO, or design-system polish until migrations and real settings persistence are validated.
- Do not open article and outreach modules before settings and media are proven stable.

## 15. Immediate Next Actions

1. Install the missing packages into the workspace.
2. Generate Prisma client and run the first CockroachDB migration.
3. Seed baseline data for `site_settings` and admin users.
4. Validate admin settings save flow and homepage/contact re-render.
5. Validate media upload to R2 and use the uploaded asset as the hero image.
6. Normalize canonical URL handling and any env-policy mismatches discovered during activation.

# Down Below Family Health Initiative with Dr. Didi

> Production upgrade plan for evolving the current prototype into the live platform at `down-below.com.ng` without rebuilding from scratch.

## 1. Product Direction

### Official Brand

- Primary name: **Down Below Family Health Initiative with Dr. Didi**
- Tagline: **Expose in Love, teach, heal, and win the world for God.**
- Motto: **Expose in Love, Teach, Heal, Win.**
- Domain: `down-below.com.ng`

### Fixed Product Constraints

- Keep the current Next.js codebase and upgrade it incrementally.
- Keep the current colour system and design tone.
- Replace the current font system with a clean sans-serif system that feels modern, professional, and medically trustworthy.
- Use **CockroachDB** as the primary relational database.
- Use **Cloudflare R2** for media and downloadable asset storage.
- Do **not** depend on an email API for phase 1 production.
- Public contact must route through **WhatsApp** and the official **Gmail** address.
- The **V-Vault** page must use Dr. Didi's contact details and not depend on automated email delivery.
- Hero images and all editable assets must become admin-managed.

### Upgrade Goal

Move the current prototype from static/demo content to a production-ready platform with:

- managed content
- managed assets
- admin workflows
- secure data storage
- production operations
- clear delivery phases

## 2. Current Prototype Assessment

### What already exists

- Public pages for home, about, library, outreach, vault, and contact
- A working Next.js 16 App Router foundation
- Existing design tokens and colour palette
- Basic validation for forms
- API routes for contact and V-Vault submissions

### What blocks production today

- Content is mostly hardcoded in files
- Hero images and other assets are not admin-editable
- Contact and V-Vault routes only log submissions
- No CockroachDB integration yet
- No Cloudflare R2 integration yet
- No admin dashboard yet
- No structured CMS/content workflow yet
- Branding, metadata, and messaging are not fully aligned with the new positioning
- No production analytics, auditing, moderation, or operational workflow

## 3. Target Production Architecture

### Application Layer

- Keep the current Next.js application as the main codebase
- Continue using App Router and TypeScript
- Refactor static content into database-backed and settings-backed content over time

### Data Layer

- **CockroachDB** for structured application data
- Suggested ORM: **Prisma** or **Drizzle**
- Recommendation: use **Prisma** if admin velocity matters more than low-level SQL control; use **Drizzle** if the team wants thinner abstractions and tighter SQL ownership

### Storage Layer

- **Cloudflare R2** for:
  - hero images
  - article cover images
  - outreach gallery images
  - downloadable PDFs and guides
  - future media assets

### Admin Authentication

- Phase 1 recommendation: restricted admin access using whitelisted Google accounts for Dr. Didi and approved staff
- Add role-based access control from the start
- Roles:
  - `super_admin`
  - `editor`
  - `moderator`

### Hosting and Delivery

- Frontend and server routes: Vercel
- Domain: `down-below.com.ng`
- DNS and asset delivery: Cloudflare
- Media delivery: Cloudflare R2 public bucket or signed delivery strategy depending on asset type

## 4. Production Data Model

These entities should be introduced before content migration begins.

### Core tables

- `admin_users`
- `roles`
- `site_settings`
- `media_assets`
- `pages`
- `navigation_items`
- `seo_metadata`
- `contact_channels`

### Content tables

- `articles`
- `article_categories`
- `article_tags`
- `article_blocks` or `article_content`
- `faq_items`
- `outreach_events`
- `outreach_gallery_items`
- `team_members`
- `testimonials` if later approved

### Workflow tables

- `vault_submissions`
- `contact_click_logs` or `lead_events`
- `audit_logs`
- `publish_revisions`
- `feature_flags`

### Critical settings to store in `site_settings`

- site name
- tagline
- motto
- primary WhatsApp number
- official Gmail address
- hero headline
- hero supporting text
- hero image asset ID
- homepage CTA labels and links
- footer text
- social links
- SEO defaults

## 5. Admin Scope

The admin side is part of the production upgrade, not a later separate build.

### Phase 1 admin modules

- Dashboard overview
- Site settings manager
- Media library
- Homepage editor
- Library/article manager
- Outreach content manager
- FAQ manager
- V-Vault submission inbox
- Admin user management
- Audit log viewer

### Admin capabilities by module

#### Site settings manager

- Update site name, tagline, motto, and contact details
- Update global SEO defaults
- Update navbar and footer details
- Set active hero image

#### Media library

- Upload, replace, crop reference, alt text, and archive assets
- Store files in R2 and metadata in CockroachDB
- Track usage so editors know where an image is currently used

#### Homepage editor

- Update hero content without code changes
- Swap hero image from media library
- Update home page sections in structured fields

#### Library manager

- Create, edit, draft, publish, and unpublish articles
- Assign cover image, category, author, and SEO metadata
- Support rich text or block-based content

#### Outreach manager

- Update event summaries, impact metrics, and gallery assets
- Control published order of outreach items

#### V-Vault inbox

- Review new submissions
- Mark as reviewed, answered privately, or approved for public FAQ reuse
- Add moderation notes
- Convert selected answered questions into public FAQ entries

## 6. Public Experience Changes

### Brand and messaging updates

- Replace all old naming with **Down Below Family Health Initiative with Dr. Didi**
- Replace the current tagline everywhere with: **Expose in Love, teach, heal, and win the world for God.**
- Replace the current motto everywhere with: **Expose in Love, Teach, Heal, Win.**

### Typography update

- Move to a sans-forward typography system
- Recommended candidates:
  - **Manrope**
  - **DM Sans**
  - **General Sans** if licensing is approved
- Recommendation: **Manrope** for headings and body if a single-family system is desired

### Colour system

- Keep the existing colour tokens and visual identity
- Tighten contrast, spacing, and type scale rather than rebranding the palette

### Home page updates

- Make hero image fully admin-editable
- Make hero heading, subtext, stat cards, and CTA labels admin-editable
- Replace prototype copy with final brand language
- Add structured trust markers: credentials, mission, outreach proof, and faith-sensitive positioning

### Contact page updates

- Make WhatsApp the primary action
- Make Gmail the secondary action
- Optional phase 2 addition: callback request form saved to DB without email delivery
- Remove any messaging that implies automated email confirmations

### V-Vault page updates

- Keep anonymous question submission as a secure database workflow
- Show Dr. Didi's WhatsApp and Gmail contact details clearly for direct follow-up
- Add clear privacy disclaimer: anonymous submission does not guarantee immediate response
- Allow admin to decide whether questions become public FAQs

## 7. Content and Asset Management Rules

All assets should become updateable without code edits.

### Assets to make admin-managed

- homepage hero image
- logo variations
- OG image
- article cover images
- outreach gallery images
- downloadable guides and PDFs
- founder/profile images
- partner logos if used later

### Content to make admin-managed

- homepage content blocks
- about page content
- library articles
- outreach metrics and stories
- FAQ items
- footer and contact details
- SEO defaults and page metadata

### Editorial workflow

- Draft
- Review
- Publish
- Archive

### Non-functional requirement

- Every published asset and content change must be reversible through revision history or explicit replacement logging.

## 8. Security, Compliance, and Privacy

### Required controls

- Server-side validation for all submission routes
- Rate limiting on V-Vault and contact-related actions
- CSRF and abuse protections where relevant
- Input sanitisation for rich content
- Role-based admin access
- Audit logging for admin actions
- Secure secrets handling for CockroachDB, R2, and auth

### Sensitive workflow rules

- Do not collect unnecessary personal health data on public forms
- Keep V-Vault submissions minimal and purpose-specific
- Add clear disclaimers that site content is educational and not emergency medical care
- Add moderation workflow before any user-submitted question is published publicly

## 9. SEO, Analytics, and Operations

### SEO work

- Replace all default metadata with the final brand name and domain
- Add canonical URLs for `down-below.com.ng`
- Add structured metadata for articles and organization details
- Generate sitemap and robots rules from live content

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

## 10. Delivery Plan in Order

This is the recommended order of delivery for implementation.

### Phase 0. Discovery and Freeze

Duration: 2 to 3 days

Deliverables:

- Confirm final brand text, WhatsApp number, Gmail address, and legal owner details
- Confirm admin user list and roles
- Confirm font choice
- Confirm which prototype content is approved for migration
- Confirm final domain and DNS ownership for `down-below.com.ng`

Acceptance criteria:

- No unresolved brand, contact, or ownership ambiguity remains

### Phase 1. Foundation Hardening

Duration: 4 to 6 days

Deliverables:

- Clean up prototype naming and metadata base assumptions
- Introduce environment strategy for local, preview, and production
- Add database and storage integration skeletons
- Add auth and RBAC foundation for admin access
- Add migration workflow and seed strategy

Acceptance criteria:

- App can run locally and in preview with CockroachDB and R2 configured
- Admin route access is protected

### Phase 2. Content Model and Admin Backbone

Duration: 1 to 1.5 weeks

Deliverables:

- Build CockroachDB schema
- Build media upload pipeline to R2
- Build admin shell and dashboard
- Build site settings manager
- Build media library
- Build audit logging

Acceptance criteria:

- Admin can log in, upload assets, and update core site settings without code changes

### Phase 3. Homepage and Global Content Migration

Duration: 1 week

Deliverables:

- Move homepage hero and major home sections into managed content
- Make hero image switchable from admin
- Update navbar, footer, metadata, and global brand copy
- Replace old typography with selected sans font system

Acceptance criteria:

- Homepage can be edited end-to-end from admin
- Typography and branding match the approved production identity

### Phase 4. Library and Outreach Productionization

Duration: 1 to 1.5 weeks

Deliverables:

- Migrate articles into database-backed or structured CMS-backed records
- Add drafts, publishing, and SEO fields
- Migrate outreach entries and gallery assets
- Optimize images and delivery through R2

Acceptance criteria:

- Editors can publish and update articles and outreach content without developer involvement

### Phase 5. Contact and V-Vault Operational Workflows

Duration: 4 to 6 days

Deliverables:

- Rework contact page to WhatsApp-first and Gmail-second flows
- Rework V-Vault to store submissions in CockroachDB
- Add moderation queue in admin
- Add privacy text and response expectations
- Track contact click events and submission events

Acceptance criteria:

- Contact does not depend on email API
- V-Vault submission and review workflow works end-to-end

### Phase 6. Production Readiness

Duration: 4 to 6 days

Deliverables:

- SEO completion
- accessibility pass
- performance optimisation
- error tracking and analytics integration
- backup and recovery documentation
- role and permission review

Acceptance criteria:

- Lighthouse and accessibility targets are met
- Monitoring and rollback paths are documented

### Phase 7. UAT, Launch, and Handover

Duration: 3 to 5 days

Deliverables:

- UAT with Dr. Didi or delegated admins
- content QA pass
- production deployment to `down-below.com.ng`
- admin training
- handover pack and operating guide

Acceptance criteria:

- Business owner can update content and assets without engineering support

## 11. SDLC Workstreams

### Workstream A. Product and Content

- Finalise IA, messaging, and approved content inventory
- Define page ownership and editorial approval flow
- Define what qualifies as publishable public medical education content

### Workstream B. Design System

- Preserve colour tokens
- Introduce the new sans font system
- Standardise spacing, typography scale, form styling, and card treatments
- Add responsive rules for mobile-first production polish

### Workstream C. Backend and Data

- Add CockroachDB schema and migrations
- Build repository/service layer for content, settings, and submissions
- Add audit logs and moderation statuses

### Workstream D. Storage and Media

- Implement R2 uploads
- Generate stable asset URLs
- Track metadata, alt text, and usage references

### Workstream E. Admin Experience

- Build secure admin routes
- Deliver settings, media, content, and moderation tools
- Add role-specific permissions and safe publishing flows

### Workstream F. QA and Release

- Unit tests for validation and critical utilities
- Integration tests for submission routes and admin actions
- End-to-end tests for publishing, media upload, and V-Vault moderation
- Pre-launch checklist and rollback plan

## 12. Suggested Acceptance Criteria by Area

### Branding

- New site name, tagline, and motto are reflected across UI, metadata, and admin settings

### Home page

- Admin can replace hero image in under 2 minutes without code deployment

### Contact

- WhatsApp and Gmail actions work correctly on mobile and desktop

### V-Vault

- Anonymous submissions are stored securely and appear in the admin moderation queue

### Assets

- All editorial images and downloadable assets are managed through R2-backed admin flows

### Operations

- Production deployment, monitoring, and rollback paths are documented and tested

## 13. Recommended Implementation Decisions

These are the recommended default decisions unless business constraints change.

- Keep the existing public site routes and progressively refactor them instead of rebuilding the frontend
- Use CockroachDB for all production records and settings
- Use Cloudflare R2 for all non-code assets
- Use Google-based admin sign-in with role restrictions in phase 1
- Use WhatsApp and Gmail as the official public communication channels in phase 1
- Keep anonymous V-Vault intake, but route response handling through admin moderation instead of email automation
- Make `site_settings` the source of truth for brand and contact details

## 14. Immediate Next Actions

1. Approve the official WhatsApp number, Gmail address, and the exact public display format for both.
2. Approve the final sans font selection.
3. Approve the admin user list and roles.
4. Approve whether articles will live fully in CockroachDB or use a hybrid content model.
5. Start implementation with Phase 0 and Phase 1 only, then review before content migration.

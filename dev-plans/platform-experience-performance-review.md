# Down Below Platform Review and Upgrade Order

Date: 2026-05-09

## Review Frame

This review treats Down Below as a public trust platform for a Nigerian NGO and international health organization. The standard is calm, credible, mobile-first, accessible, fast, and easy for non-technical admins to operate.

The platform already has a strong base: Next.js App Router, typed validation, Prisma persistence, R2 media upload, admin authentication, site settings, team management, gallery management, V-Vault moderation, and public fallback content. The next work should protect that base while tightening trust, polish, and speed.

## Phase 1 - Trust, Polish, and Mobile Fundamentals

### 1. Stabilize the design system tokens

Problem:
- Several pages use `--color-bg`, `--color-muted`, and `--color-text-muted`, but those tokens are not defined in `globals.css`.
- This can silently fall back to invalid styles and make pages look inconsistent across browsers.
- `h1`, `h2`, and `h3` use negative letter spacing, which weakens readability on small screens and conflicts with the project UI standard.

Implementation:
- Define all consumed design tokens in one place.
- Remove negative global letter spacing.
- Add a visible `focus-visible` style for links, buttons, fields, and controls.

Acceptance criteria:
- No public page references undefined design tokens.
- Keyboard users can see focus location on every interactive element.
- Heading letter spacing is `0`.
- Mobile typography remains readable at 320px width.

### 2. Replace noisy first-load motion with a quieter brand moment

Problem:
- `WelcomeIntro` blocks the first session with a full-screen animated overlay for about 3.4 seconds.
- It increases client JavaScript through `framer-motion`.
- For mobile-only visitors, this delays the actual support content they came for.

Implementation:
- Convert the intro into a non-blocking, optional micro-brand treatment that does not delay the first meaningful paint of the page. It should only be 3 seconds, then the main content appears. It must be seen before the main page content, but it should not block the user from seeing the main content. It should be a nice-to-have, not a must-have. It should be more-time preccise. 
- If retained, respect `prefers-reduced-motion`.
- Keep the first viewport immediately useful.

Acceptance criteria:
- First meaningful content is  visible after just 3 seconds of the overlay. 
- Lighthouse does not flag excessive main-thread work from the intro.

### 3. Make navigation more compact and task-based

Problem:
- The primary nav is growing: Home, Library, About, Team, Gallery, V-Vault, Outreach, and now Podcast.
- Desktop spacing risks crowding at laptop widths.
- Mobile drawer is usable but not strongly prioritized by user tasks.

Implementation:
- Group public content around user intent: Learn, Ask, Outreach, Podcast, About, Contact.
- Keep "Book Now" as the primary action.
- Make drawer touch targets at least 44px high.

Acceptance criteria:
- Navigation does not wrap or collide at 1024px.
- Mobile drawer items are comfortably tappable.
- Podcast is discoverable from header and footer.
- Current labels stay short and plain.

## Phase 2 - Content UX and NGO Credibility

### 4. Make the library search and filters real

Problem:
- The search field and category buttons are currently visual only.
- This creates broken trust because the UI promises filtering but does not execute.

Implementation:
- Add query-state filtering for article search and category.
- Keep it server-friendly where possible.
- Add empty states and clear filter action.

Acceptance criteria:
- Search filters articles by title, excerpt, and tags.
- Category filters update visible results.
- Empty state explains that no result matched and provides a reset action.
- Filtering works on mobile without horizontal layout breakage.

### 5. Strengthen medical trust cues

Problem:
- Disclaimers exist, but trust architecture can be stronger.
- Health content should clearly separate education, urgent care, consultation, and community support.

Implementation:
- Add consistent medical disclaimer component.
- Add urgent-care guidance where relevant.
- Add author/reviewer metadata to articles and podcast show notes.
- Add last-reviewed date for medical content.

Acceptance criteria:
- Every medical education page has a consistent disclaimer.
- Users can distinguish education from medical advice.
- Article and podcast detail pages show author and review context.

### 6. Improve emotional design without visual noise

Problem:
- The brand is heartfelt, but several pages use decorative emoji, large cards, hover-only overlays, and repeated CTA strips.
- This can feel less institutional than the opportunity requires.

Implementation:
- Reduce decorative emoji in professional surfaces.
- Use real field images as the emotional layer.
- Prefer quiet bands, clear section rhythm, and fewer competing CTAs.
- Keep cards for actual repeated items only.

Acceptance criteria:
- Pages feel credible without becoming cold.
- Mobile users see the main action and core message without scrolling through decoration.
- Hover-only information also appears on touch devices.

## Phase 3 - Performance and Core Web Vitals

### 7. Move fonts to the Next.js font module

Problem:
- Fonts are imported through CSS `@import`, which creates a render-blocking external request.
- The README lists different fonts than the actual CSS, so documentation is stale.

Implementation:
- Use `next/font/google` in the root layout.
- Remove the CSS `@import`.
- Update README to match actual font strategy.

Acceptance criteria:
- No Google Fonts CSS `@import` remains.
- Fonts are self-hosted by Next.js build output.
- CLS does not regress from font loading.

### 8. Revisit forced dynamic rendering

Problem:
- Several public pages export `dynamic = 'force-dynamic'`.
- This disables useful prerendering and caching for mostly static public pages.

Implementation:
- Keep admin routes dynamic.
- Keep pages with request-time data dynamic only where necessary.
- Cache or fallback public data access where appropriate.

Acceptance criteria:
- Static content pages build statically where possible.
- Public pages that read DB settings use an intentional caching strategy.
- `next build` output confirms fewer dynamic public routes.

### 9. Tune image strategy

Problem:
- Some images use inline fixed heights, `quality={100}`, and priority more often than necessary.
- The gallery can create many image requests on mobile.

Implementation:
- Use aspect-ratio containers instead of inline fixed heights.
- Reserve `priority` for the true LCP image only.
- Use reasonable quality defaults.
- Add pagination or progressive loading to large galleries if image count grows.

Acceptance criteria:
- No image causes layout shift.
- Homepage LCP image is prioritized.
- Below-fold images lazy-load.
- Gallery remains usable on low-bandwidth mobile.

## Phase 4 - Admin Operations

### 10. Make admin forms more forgiving

Problem:
- Admin forms are functional but dense.
- Some fields require exact values, long descriptions, or seconds-based durations.

Implementation:
- Add helper copy where data shape matters.
- Use generated slugs with manual override.
- Use media picker/upload patterns consistently.
- Show validation issues inline with specific messages and it should be closable.

Acceptance criteria:
- Admin can create public content without code changes.
- Validation errors point to the exact field.
- Audio, image, and content fields are clear enough for non-engineers.

### 11. Improve audit and operational visibility

Problem:
- Audit logs exist but are not surfaced as a review workflow.
- Admin dashboard does not yet include podcast or content readiness metrics.

Implementation:
- Add podcast count to dashboard.
- Later add recent audit activity and content status summaries.

Acceptance criteria:
- Dashboard reflects all active content modules.
- Admin can see draft vs published counts for major content types.

## Phase 5 - Podcast Launch Slice

Implementation order:
1. Add `PodcastEpisode` model and migration.
2. Add repository methods.
3. Add validation schema.
4. Add admin API routes.
5. Add admin podcast board with create, edit, delete, audio upload, and cover upload.
6. Add `/podcast` public listing.
7. Add `/podcast/[slug]` detail page for show notes.
8. Add nav, footer, and dashboard integration.
9. Run lint, Prisma generate, and production build.

Acceptance criteria:
- Admins can create, edit, publish, archive, and delete podcast episodes.
- Admins can upload audio through existing R2-backed media flow.
- Public users can play episodes in-browser.
- Public users can download episodes.
- Public pages are mobile-first and usable at 320px width.
- Episode pages have metadata and show notes.
- Build and lint pass.

## Execution Update - 2026-05-09

Completed in this pass:
- Phase 1: stabilized missing design tokens, added visible focus states, removed the blocking welcome intro from root rendering, tightened navigation spacing, and added active navigation semantics.
- Phase 2: made Health Library search and category filters functional, added reusable medical disclaimers, added article review context, and reduced casual decorative emoji on trust-critical pages.
- Phase 3: removed the render-blocking Google Fonts CSS import, moved the platform to a production-safe system font stack, reduced unnecessary image preloading, lowered the homepage hero image quality from `100` to `86`, and tightened responsive image sizing.
- Phase 4: added podcast metrics and admin navigation, hardened the admin dashboard against a pre-migration podcast table, and added helper guidance to podcast admin fields.
- Phase 5: implemented and activated the podcast system end to end, then applied the database migration successfully.

Verification completed:
- `npx prisma validate`
- `npx prisma migrate deploy`
- `npx prisma migrate status`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

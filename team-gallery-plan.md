# Team Page, Gallery Page & Font Overhaul — Actionable Plan

> **Date:** 2026-05-08  
> **Scope:** `/team`, `/gallery`, project-wide sans-serif font replacement  
> **Affected layers:** Schema → Seed → Repository → API → Pages → Components → Navbar → Admin
> NOTE FROM REVIEW: Individual images should not have their own page, just a lightbox on the gallery page. This is a significant scope reduction and should be reflected in the plan and timeline.
---

## Executive Summary

| Deliverable | What it is | DB? | Admin? |
|---|---|---|---|
| Font overhaul | Replace Cormorant Garamond serif with DM Sans project-wide | No | No |
| `/team` | Hierarchical team page (Founder hero → Leadership → Core) | Yes — `TeamMember` | Yes — CRUD + image upload |
| `/gallery` | Filterable photo grid (outreach, events, team, community) | Yes — `GalleryImage` | Yes — upload + metadata edit |

---

## Phase 0 — Font Overhaul (Project-Wide)

**Goal:** Remove the serif `Cormorant Garamond` and `Dancing Script` from all headings and decorative text. Replace with `DM Sans` — a clean, humanist sans-serif that reads as professional and warm. Keep `Plus Jakarta Sans` for body copy.

**Why DM Sans:** Round apertures, optical balance at large display sizes, excellent at weights 400–700, pairs cleanly with Plus Jakarta Sans without competing. Approved for health and editorial sites.

### 0.1 Files to change

| File | Change |
|---|---|
| `src/app/globals.css` | Swap Google Fonts import. Replace `--font-heading` and `--font-signature`. |
| `src/app/layout.tsx` | No change needed (uses CSS variables). |

### 0.2 New Google Fonts import string

```css
/* Replace current @import with: */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
```

### 0.3 CSS variable changes

```css
--font-heading: 'DM Sans', system-ui, sans-serif;
--font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
/* Remove --font-signature entirely OR repurpose: */
--font-display: 'DM Sans', system-ui, sans-serif;  /* for large hero numbers / stats */
```

### 0.4 Callout — heading weight adjustment

Cormorant is a display serif — it reads beautifully at weight 700 at 4rem+. DM Sans at weight 700 is tighter. Audit these elements after the swap and adjust to `font-weight: 600` with a slight letter-spacing of `-0.01em` to `-0.02em`:
- Hero `<h1>` — `font-weight: 700`, `letter-spacing: -0.02em`
- Section headings `<h2>` — `font-weight: 600`, `letter-spacing: -0.01em`
- Card titles `<h3>` — `font-weight: 600`

Add these to `globals.css`:

```css
h1 { letter-spacing: -0.02em; }
h2 { letter-spacing: -0.015em; }
h3 { letter-spacing: -0.01em; }
```

### 0.5 Removal scope — `.font-signature` uses

Search the codebase for `font-signature` and `Dancing Script`:

- If used as decorative tagline / signature text → replace class with `font-heading italic` (DM Sans has an italic axis)
- If not used anywhere yet → remove the class from globals.css

### 0.6 Verification

After the swap:
1. Run `npm run dev -- --webpack`
2. Visual check: hero, section headings, cards, navbar brand name, footer brand name, article titles, form labels
3. Confirm no `font-family: Georgia` or `serif` remains in any inline style
4. Run `npm run lint && npx tsc --noEmit` — 0 errors

---

## Phase 1 — Prisma Schema: Two New Models

### 1.1 New enum

```prisma
enum TeamTier {
  founder
  leadership
  core
}

enum GalleryCategory {
  outreach
  event
  team
  community
  facility
}
```

### 1.2 `TeamMember` model

```prisma
model TeamMember {
  id          String            @id @default(cuid())
  slug        String            @unique
  name        String
  role        String
  tier        TeamTier
  sortOrder   Int               @default(0)
  credentials String
  bio         String
  imageUrl    String?
  imageAlt    String?
  status      PublicationStatus @default(published)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}
```

**Field notes:**
- `tier` drives the visual hierarchy on the page (Founder hero → Leadership row → Core grid)
- `sortOrder` allows admin drag-to-reorder without re-tiering
- `imageUrl` points to Cloudflare R2 (or Unsplash placeholder for seeds)
- `status` allows drafting a new member before publishing

### 1.3 `GalleryImage` model

```prisma
model GalleryImage {
  id          String          @id @default(cuid())
  slug        String          @unique
  title       String
  description String
  caption     String?
  imageUrl    String
  imageAlt    String
  category    GalleryCategory
  eventName   String?
  location    String?
  capturedAt  DateTime?
  status      PublicationStatus @default(published)
  sortOrder   Int               @default(0)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}
```

**Field notes:**
- `slug` is the URL key for `/gallery/[slug]`
- `description` is the full caption shown on the individual image page (required — minimum 2 sentences)
- `caption` is the short overlay text shown in the grid
- `eventName` + `location` + `capturedAt` provide editorial context on the detail page
- `category` drives the filter tabs on the gallery grid

### 1.4 Migration commands

```bash
npm run db:migrate   # name: add_team_member_and_gallery_image
npm run db:generate  # regenerate client — required before TypeScript will see the models
```

---

## Phase 2 — Seed Data Files

### 2.1 `src/data/team.ts` — extend existing

Keep the existing `TeamMember` interface compatible with the new Prisma model. Add `slug`, `tier`, `sortOrder` to the seed shape.

Seed rows:

| slug | name | role | tier | sortOrder |
|---|---|---|---|---|
| `dr-edidiong-ekereuke` | Dr. Edidiong Ekereuke | Founder & Lead Physician | founder | 0 |
| `ngozi-eze` | Ngozi Eze | Community Health Officer | core | 1 |
| `amaka-obi` | Amaka Obi | Health Communications Lead | core | 2 |

Add 2–3 placeholder `leadership` tier members to demonstrate the layout tier before admin fills them.

### 2.2 Create `src/data/gallery.ts` — new file

Minimum 6 seed images across 3 categories. Use real-looking Unsplash SRH/community photos. Each must have a proper `description` (2–3 sentences, non-generic) and a `slug`.

Example seeds:

| slug | title | category | eventName | location |
|---|---|---|---|---|
| `calabar-outreach-march-2025` | Community Health Outreach — March 2025 | outreach | March SRH Drive | Calabar, CRS |
| `pink-africa-screening-2024` | Cervical Screening Day at Pink Africa | event | Pink Africa Partnership | Cross River |
| `team-ucth-2024` | Our Team at UCTH | team | — | UCTH Calabar |
| `infertility-talk-2025` | Infertility Education Session | outreach | Grassroots Health Talk | Odukpani, CRS |
| `clinic-consultation-day` | Open Consultation Day | facility | Monthly Consultation | Calabar |
| `dr-didi-speaking` | Dr. Didi at Faith & Health Forum | event | Faith & Health Conference | Calabar, CRS |

### 2.3 Seed script `prisma/seed.mjs`

Add seed functions for both models at the bottom of the existing seed file:

```js
// seedTeamMembers() — upsert on slug
// seedGalleryImages() — upsert on slug
```

Run with: `npm run db:seed`

---

## Phase 3 — Repository Functions

Add to `src/lib/admin/repository.ts`:

### Team

```ts
// Public
getPublishedTeamMembers(): Promise<TeamMember[]>
  // ORDER BY tier ASC (founder first), then sortOrder ASC

// Admin
getAllTeamMembers(): Promise<TeamMember[]>
createTeamMember(data): Promise<TeamMember>
updateTeamMember(id, data): Promise<TeamMember>
deleteTeamMember(id): Promise<void>
```

### Gallery

```ts
// Public
getPublishedGalleryImages(category?: GalleryCategory): Promise<GalleryImage[]>
  // ORDER BY sortOrder ASC, capturedAt DESC

getGalleryImageBySlug(slug: string): Promise<GalleryImage | null>

// Admin
getAllGalleryImages(): Promise<GalleryImage[]>
createGalleryImage(data): Promise<GalleryImage>
updateGalleryImage(id, data): Promise<GalleryImage>
deleteGalleryImage(id): Promise<void>
```

---

## Phase 4 — Admin API Routes

### 4.1 Team admin endpoints

```
src/app/api/admin/team/route.ts
```
- `GET` — list all team members (auth required)
- `POST` — create member (auth required)

```
src/app/api/admin/team/[id]/route.ts
```
- `PUT` — update member (auth required)
- `DELETE` — delete member (auth required)

### 4.2 Gallery admin endpoints

```
src/app/api/admin/gallery/route.ts
```
- `GET` — list all gallery images (auth required)
- `POST` — create gallery image record (auth required)

```
src/app/api/admin/gallery/[id]/route.ts
```
- `PUT` — update image metadata (auth required)
- `DELETE` — delete image (auth required)

**Note:** Image upload goes through existing `POST /api/admin/media` (R2 upload). Admin first uploads the image via media endpoint to get the R2 URL, then creates/updates the gallery or team record with that URL.

### 4.3 Validation schemas in `src/lib/validations.ts`

Add:

```ts
teamMemberSchema     // name, role, tier, credentials, bio, sortOrder, imageUrl, imageAlt, status
galleryImageSchema   // slug, title, description, caption, imageUrl, imageAlt, category, eventName, location, capturedAt, status
```

---

## Phase 5 — `/team` Page

### 5.1 File

```
src/app/team/page.tsx
```

### 5.2 Page metadata

```ts
export const metadata: Metadata = {
  title: 'Our Team',
  description: 'Meet Dr. Didi and the Down Below Family Health Initiative team — clinicians, community health officers, and advocates serving women across Nigeria.',
}
```

### 5.3 Layout structure

```
┌─────────────────────────────────────────────────────┐
│  PAGE HERO (dark green banner)                      │
│  "Meet Our Team" headline                           │
│  Subtitle: "Clinicians, educators, community..."   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  FOUNDER CARD (full-width feature card)             │
│  Large portrait (left, 40%) | Bio + credentials    │
│  (right, 60%) | Badge: "Founder & Lead Physician"  │
│  Slightly elevated with shadow + primary border    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  LEADERSHIP TIER (if any leadership members exist) │
│  Section label: "Leadership"                       │
│  2-column grid, medium cards                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  CORE TEAM                                          │
│  Section label: "Core Team"                        │
│  3-column grid (mobile: 1, tablet: 2, desktop: 3) │
│  Smaller cards: photo + name + role + credentials  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  JOIN US CTA (optional)                            │
│  "Interested in volunteering?" → /contact          │
└─────────────────────────────────────────────────────┘
```

### 5.4 Founder card spec

- Photo: `object-cover` round-cornered rectangle, 360×440 on desktop
- Name: `text-3xl font-bold` (DM Sans 700)
- Role badge: pill with `--color-primary` background, white text
- Credentials: muted text with `GraduationCap` icon
- Bio: `text-base leading-relaxed`, up to 4 lines, full text shown (no truncation for founder)

### 5.5 Core team card spec

- Photo: square or 3:4 aspect ratio, `object-cover`, rounded-lg
- Name: `text-lg font-semibold`
- Role: `text-sm` muted with accent color left border
- Credentials: icon + small text
- Bio: `text-sm leading-relaxed line-clamp-3` — hover reveals full bio in Framer Motion expand animation

### 5.6 Empty state

If no published team members are in DB: render seed data from `src/data/team.ts` as fallback (same pattern as library/outreach pages).

### 5.7 Server component

```ts
export const dynamic = 'force-dynamic'
// getPublishedTeamMembers() called in the RSC, no client state needed
```

---

## Phase 6 — `/gallery` Page

### 6.1 File

```
src/app/gallery/page.tsx
```

### 6.2 Page metadata

```ts
export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Photos from Down Below Family Health Initiative events, community outreach programmes, team activities, and health talks across Nigeria.',
}
```

### 6.3 Layout structure

```
┌─────────────────────────────────────────────────────┐
│  PAGE HERO (dark green)                             │
│  "Gallery" + subtitle                              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  FILTER BAR (sticky on scroll)                     │
│  All | Outreach | Events | Team | Community        │
│  Active tab: primary underline + accent dot        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  IMAGE GRID (responsive masonry-inspired columns)  │
│  Mobile: 2 columns                                │
│  Tablet: 3 columns                               │
│  Desktop: 4 columns                              │
│  Each cell: image + hover overlay with title      │
│  + category badge + arrow icon                   │
│  Click → /gallery/[slug]                          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  EMPTY STATE (per category)                        │
│  "No [category] photos yet. Check back soon."     │
└─────────────────────────────────────────────────────┘
```

### 6.4 Filter bar behaviour

- URL search param: `?category=outreach`
- Server component reads `searchParams.category`
- Tabs rendered as `<Link>` elements (not client-side buttons) for shareable URLs and SEO

```ts
// src/app/gallery/page.tsx
export default async function GalleryPage({ searchParams }) {
  const category = searchParams?.category as GalleryCategory | undefined
  const images = await getPublishedGalleryImages(category)
  // ...
}
```

### 6.5 Image grid card spec

- `next/image` with `fill` + `object-cover`
- Aspect ratio: 3:4 for portrait images, 4:3 for landscape — enforce with CSS `aspect-ratio`
- Hover: dark overlay (rgba 0,0,0,0.45) slides in from bottom with Framer Motion
- Overlay contains: title (white, font-semibold), category pill, arrow icon
- Card border-radius: `--radius-md`
- Lazy loaded below fold

### 6.6 Category badge colours

| Category | Background | Text |
|---|---|---|
| outreach | `#dcfce7` | `#166534` |
| event | `#fce7f3` | `#be185d` |
| team | `#dbeafe` | `#1e40af` |
| community | `#fef9c3` | `#854d0e` |
| facility | `#ede9fe` | `#7c3aed` |

---

## Phase 7 — `/gallery/[slug]` Individual Image Page

### 7.1 File

```
src/app/gallery/[slug]/page.tsx
```

### 7.2 Layout

```
┌─────────────────────────────────────────────────────┐
│  BREADCRUMB: Home / Gallery / [title]              │
└─────────────────────────────────────────────────────┘

┌──────────────────────────────┬──────────────────────┐
│                              │  METADATA PANEL      │
│  PRIMARY IMAGE               │  Title (h1)          │
│  (max 720px tall,            │  Category badge      │
│  object-contain or cover,    │  Description (full)  │
│  rounded-xl)                 │  ─────────────────  │
│                              │  Event: [eventName]  │
│                              │  Location: [loc]     │
│                              │  Date: [capturedAt]  │
│                              │  ─────────────────  │
│                              │  ← Back to Gallery   │
└──────────────────────────────┴──────────────────────┘

┌─────────────────────────────────────────────────────┐
│  RELATED IMAGES (same category, 3 cards)           │
└─────────────────────────────────────────────────────┘
```

**Mobile:** stacks — image top, metadata below, related at bottom.

### 7.3 Metadata

```ts
export async function generateMetadata({ params }) {
  const image = await getGalleryImageBySlug(params.slug)
  return {
    title: image?.title ?? 'Gallery Image',
    description: image?.description?.slice(0, 160),
    openGraph: { images: [{ url: image?.imageUrl, alt: image?.imageAlt }] },
  }
}
```

### 7.4 Not-found handling

```ts
if (!image || image.status !== 'published') notFound()
```

---

## Phase 8 — Admin Panel UI

### 8.1 Team admin page

```
src/app/admin/team/page.tsx
```

Layout:
- Table: sortOrder | photo thumbnail | name | tier | role | status | Edit / Delete buttons
- "Add Member" button → slide-over form
- Form fields: name, role, tier (select), sortOrder, credentials, bio, status (select)
- Image: click to open media picker → existing `MediaAsset` library OR upload new (triggers `POST /api/admin/media` then sets the URL)

### 8.2 Gallery admin page

```
src/app/admin/gallery/page.tsx
```

Layout:
- Masonry grid view (same as public) with edit overlay on hover
- Filter by category
- "Upload Image" button → modal with fields:
  - Upload photo (via R2 media endpoint)
  - Title (required)
  - Description (required, textarea, min 40 chars enforced by Zod)
  - Caption (optional, short)
  - Category (select)
  - Event Name (optional)
  - Location (optional)
  - Captured At (date picker, optional)
  - Status (draft / published)
  - Alt text (required, auto-suggested from title)

### 8.3 Add to admin nav

In admin layout sidebar, add entries:
- "Team" → `/admin/team`
- "Gallery" → `/admin/gallery`

---

## Phase 9 — Navbar Update

Add to `navLinks` in `src/components/layout/Navbar.tsx`:

```ts
{ href: '/team', label: 'Team' },
{ href: '/gallery', label: 'Gallery' },
```

Suggested insertion position:
```ts
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/library', label: 'Library' },
  { href: '/about', label: 'About' },
  { href: '/team', label: 'Team' },      // ← new
  { href: '/gallery', label: 'Gallery' }, // ← new
  { href: '/vault', label: 'V-Vault' },
  { href: '/outreach', label: 'Outreach' },
]
```

On mobile, the menu may need scroll or a condensed label (`Gallery` → can be abbreviated if overflow is an issue, though at 7 items it should be fine with the existing hamburger).

---

## Phase 10 — Decommission Static Data Files

After seeding and verifying the DB-backed pages render correctly:

| File | Action |
|---|---|
| `src/data/team.ts` | Delete (MD-003 P3 complete) |
| `src/data/gallery.ts` | Delete (new file, seeded and replaced) |

Update the `About` page (`src/app/about/page.tsx`) which currently imports `team.ts` — switch it to call `getPublishedTeamMembers()` filtered to `tier: 'founder'` for the founders section, and remove the direct import.

---

## Execution Order (Recommended)

Work in this strict order to avoid blocked states:

```
[0]  Font overhaul (globals.css only — self-contained, immediate visual payoff)
[1]  Schema: add enums + 2 models to schema.prisma
[2]  db:migrate → db:generate
[3]  Seed data files: src/data/team.ts (extend) + src/data/gallery.ts (new)
[4]  Seed script: prisma/seed.mjs — seedTeamMembers(), seedGalleryImages()
[5]  Run db:seed — verify in db:studio
[6]  Repository functions: getPublishedTeamMembers, getPublishedGalleryImages, getGalleryImageBySlug + admin CRUD
[7]  Validation schemas in validations.ts
[8]  Admin API routes: /api/admin/team + /api/admin/gallery
[9]  Public page: /team
[10] Public page: /gallery (with filter bar)
[11] Public page: /gallery/[slug]
[12] Admin UI: /admin/team
[13] Admin UI: /admin/gallery
[14] Navbar: add Team + Gallery
[15] About page: remove static import → use repository
[16] Delete src/data/team.ts + src/data/gallery.ts
[17] Final: tsc --noEmit + npm run lint → 0 errors
```

---

## Quality Gates (Before Each Phase Ships)

- `npx tsc --noEmit` → 0 errors
- `npm run lint` → 0 errors, 0 warnings
- `npm run dev -- --webpack` visual check on mobile (375px) and desktop (1280px)
- All images have `alt` text
- `/team` has correct heading hierarchy: `h1` → page title, `h2` → tier sections, `h3` → member names
- `/gallery` filter links are keyboard-navigable
- `/gallery/[slug]` not-found page works for invalid slugs
- No `console.log` in any new route handler
- All new admin routes call `requireAdmin(request)` before data access

---

## Component Files Summary

```
src/
  app/
    team/
      page.tsx                    ← new (server component)
    gallery/
      page.tsx                    ← new (server component)
      [slug]/
        page.tsx                  ← new (server component)
    admin/
      team/
        page.tsx                  ← new (client admin UI)
      gallery/
        page.tsx                  ← new (client admin UI)
    api/
      admin/
        team/
          route.ts                ← new
          [id]/
            route.ts              ← new
        gallery/
          route.ts                ← new
          [id]/
            route.ts              ← new
  components/
    team/
      FounderCard.tsx             ← new
      TeamMemberCard.tsx          ← new
    gallery/
      GalleryGrid.tsx             ← new
      GalleryCard.tsx             ← new
      GalleryFilterBar.tsx        ← new
      ImageDetailPanel.tsx        ← new
    admin/
      TeamForm.tsx                ← new
      GalleryUploadForm.tsx       ← new
```

---

## Notes

1. **Gallery image upload flow:** Admin uploads image → `POST /api/admin/media` returns R2 URL → admin fills description/metadata → `POST /api/admin/gallery` creates the record. Two-step, no atomic file-and-metadata endpoint needed yet.
2. **Team images:** Same pattern. Admin uploads headshot → copies R2 URL → fills team member form.
3. **Alt text policy:** `imageAlt` is required on `GalleryImage` (Zod `.min(1)`) and optional-but-defaulted on `TeamMember`. Seed data must include descriptive alt text, not placeholder strings.
4. **capturedAt:** Optional on gallery images. If absent, the detail page omits the date line rather than showing `null`.
5. **Framer Motion:** Use only `motion.div` with `initial/animate/exit` variants. Do not import the full bundle — tree-shake by importing from `framer-motion` directly.
6. **`description` field policy:** Gallery image descriptions must be at least 2 substantive sentences describing what is happening in the photo, who is involved, and the context. Zod minimum: 40 characters.

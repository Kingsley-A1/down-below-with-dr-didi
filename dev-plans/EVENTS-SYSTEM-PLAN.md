# Events System — Full Implementation Plan

> **Standard**: This plan follows every architectural standard already enforced across the platform:
> Prisma 7.8 + CockroachDB · Next.js App Router · React 19 · TypeScript strict · Zod v4 ·
> Tailwind v4 CSS vars · RBAC via `requireAdminRole()` · Lucide React icons ·
> `AdminShell` / `AdminContentContainer` / `AdminPageHeader` / `AdminDataLoadAlert` layout primitives ·
> Media upload via `uploadAdminMediaAsset()` · Auto-slug on create, locked on edit ·
> `AuditLog` for every write operation.

---

## 1. Vision

The `/events` page becomes the live heartbeat of the community — surfacing upcoming and live events, events history,  allowing in-page streaming (YouTube and Facebook embeds with no redirect), and enabling users to like, comment on, and share events without leaving. The admin interface gives `super_admin` and `founder_admin` full CRUD over events with an audit trail, media upload, and stream link management.

---

## 2. What Already Exists (leverage everything)

| Asset | Location | Usage |
|---|---|---|
| `OutreachEvent` Prisma model | `prisma/schema.prisma` | Extend with stream, engagement, and scheduling fields |
| `PublicationStatus` enum | `prisma/schema.prisma` | Reuse `draft / published / archived` lifecycle |
| `MediaAsset` + `uploadAdminMediaAsset()` | `src/components/admin/media-upload.ts` | Cover image upload pipeline |
| `AuditLog` model | `prisma/schema.prisma` | One audit entry per event write |
| `AdminShell` nav + `AdminDashboardCards` | `src/components/admin/AdminShell.tsx` | Add Events nav entry |
| `AdminContentContainer` + `AdminPageHeader` | Admin UI primitives | Wrap admin events page |
| `AdminDataLoadAlert` | Admin UI primitives | Graceful load-error state |
| `requireAdminPageSession` + `requireAdminRole` | `src/lib/admin/page-guard.ts` | Auth/RBAC on all admin routes |
| `logAdminPageLoadError` | `src/lib/admin/observability.ts` | Consistent error logging |
| Auto-slug pattern | `GalleryImagesBoard` + `TeamMembersBoard` | Reuse same `slugify()` + Edit/Auto toggle |
| Camera badge + image preview | `media-upload.ts` patterns | Cover image preview + upload affordance |
| Public page hero pattern | `src/app/outreach/page.tsx` | Primary-colour hero, accent CTA, body copy |
| Podcast public embed pattern | `src/app/podcast/` | Media-embed + list UX foundation |

---

## 3. Schema Changes

### 3a. Extend `OutreachEvent` model

Replace the current minimal model with a fully-featured one. **Because the table is new (no live data), this is a drop-and-recreate migration.**

```prisma
// prisma/schema.prisma — replace OutreachEvent

model OutreachEvent {
  id              String            @id @default(cuid())
  slug            String            @unique
  title           String
  summary         String            // Short teaser shown in cards
  body            String?           // Rich long-form description (markdown/HTML)
  coverImageUrl   String?
  coverImageAlt   String?
  communityLabel  String?           // e.g. "Lagos Community" or "Virtual"
  location        String?           // Physical address / "Online"
  scheduledAt     DateTime?         // When the event starts (null = TBD)
  endedAt         DateTime?         // When it ended — used to flag "past event"
  streamUrl       String?           // YouTube/Facebook embed URL (not watch URL — converted)
  streamProvider  String?           // "youtube" | "facebook" | null
  isLive          Boolean           @default(false)  // Manually toggled by admin when live
  engagementEnabled Boolean         @default(true)   // Disable likes/comments if needed
  status          PublicationStatus @default(draft)
  publishedAt     DateTime?
  sortOrder       Int               @default(0)      // Manual ordering override
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  likes           EventLike[]
  comments        EventComment[]

  @@index([status, scheduledAt])
  @@index([slug])
}
```

### 3b. New `EventLike` model

```prisma
model EventLike {
  id        String       @id @default(cuid())
  eventId   String
  userId    String?      // null = anonymous (IP-keyed, future)
  ipHash    String?      // SHA-256 of visitor IP for anon dedup
  createdAt DateTime     @default(now())

  event     OutreachEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user      User?         @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@unique([eventId, userId])
  @@index([eventId])
}
```

### 3c. New `EventComment` model

```prisma
enum CommentStatus {
  visible
  hidden
  flagged
}

model EventComment {
  id         String        @id @default(cuid())
  eventId    String
  userId     String?
  displayName String       // Stored at write-time (immutable snapshot)
  body       String
  status     CommentStatus @default(visible)
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt

  event      OutreachEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user       User?         @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([eventId, status, createdAt])
}
```

### 3d. Migration file

```
prisma/migrations/YYYYMMDDHHMMSS_events_engagement/migration.sql
```

Run: `pnpm exec prisma migrate dev --name events_engagement`

---

## 4. Repository Layer

**File**: `src/lib/admin/repository.ts` — add to existing file.
**File**: `src/lib/events/repository.ts` — new file for public-facing read functions.

### 4a. Admin repository additions (`src/lib/admin/repository.ts`)

```ts
// ─── Types ───────────────────────────────────────────────────────────────────
export type EventRecord = {
  id: string
  slug: string
  title: string
  summary: string
  body: string | null
  coverImageUrl: string | null
  coverImageAlt: string | null
  communityLabel: string | null
  location: string | null
  scheduledAt: string | null   // ISO string
  endedAt: string | null
  streamUrl: string | null
  streamProvider: string | null
  isLive: boolean
  engagementEnabled: boolean
  status: 'draft' | 'published' | 'archived'
  publishedAt: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  _count: { likes: number; comments: number }
}

// ─── Admin CRUD ──────────────────────────────────────────────────────────────
export async function getAllEvents(): Promise<EventRecord[]>
export async function getEventById(id: string): Promise<EventRecord | null>
export async function createEvent(data: CreateEventInput, adminId: string): Promise<EventRecord>
export async function updateEvent(id: string, data: UpdateEventInput, adminId: string): Promise<EventRecord>
export async function deleteEvent(id: string, adminId: string): Promise<void>
// deleteEvent: super_admin only (checked in API route via requireAdminRole)

// ─── Comment moderation ──────────────────────────────────────────────────────
export async function getEventComments(eventId: string): Promise<EventCommentRecord[]>
export async function moderateComment(commentId: string, status: CommentStatus, adminId: string): Promise<void>
```

### 4b. Public events repository (`src/lib/events/repository.ts`)

```ts
export async function getPublishedEvents(): Promise<PublicEventRecord[]>
// Returns published events ordered by: isLive desc, scheduledAt asc (upcoming first), then past by scheduledAt desc

export async function getEventBySlug(slug: string): Promise<PublicEventRecord | null>

export async function getEventLikeCount(eventId: string): Promise<number>

export async function hasUserLikedEvent(eventId: string, userId: string): Promise<boolean>

export async function likeEvent(eventId: string, userId: string): Promise<void>
export async function unlikeEvent(eventId: string, userId: string): Promise<void>

export async function getVisibleComments(eventId: string): Promise<PublicCommentRecord[]>
export async function addComment(eventId: string, userId: string, displayName: string, body: string): Promise<PublicCommentRecord>
```

All public functions only query `status: 'published'` events.

---

## 5. API Routes

### 5a. Admin routes (auth required — admin session cookie)

| Method | Path | Role required | Purpose |
|---|---|---|---|
| `GET` | `/api/admin/events` | any admin | List all events + counts |
| `POST` | `/api/admin/events` | `editor`+ | Create event |
| `PUT` | `/api/admin/events/[id]` | `editor`+ | Update event |
| `DELETE` | `/api/admin/events/[id]` | `super_admin` | Hard delete |
| `GET` | `/api/admin/events/[id]/comments` | any admin | List all comments incl. hidden |
| `PATCH` | `/api/admin/events/[id]/comments/[commentId]` | `moderator`+ | Set comment status |

**File**: `src/app/api/admin/events/route.ts`  
**File**: `src/app/api/admin/events/[id]/route.ts`  
**File**: `src/app/api/admin/events/[id]/comments/route.ts`  
**File**: `src/app/api/admin/events/[id]/comments/[commentId]/route.ts`

Every write logs to `AuditLog` (action, targetId, adminId, metadata).

### 5b. Public routes (no auth for GET, auth required for POST)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/events` | none | Published events list |
| `GET` | `/api/events/[slug]` | none | Single event detail + counts |
| `POST` | `/api/events/[slug]/like` | user session | Toggle like |
| `DELETE` | `/api/events/[slug]/like` | user session | Remove like |
| `GET` | `/api/events/[slug]/comments` | none | Visible comments (paginated) |
| `POST` | `/api/events/[slug]/comments` | user session | Submit comment |

Rate limiting: `POST /like` — 1 request/user/event · `POST /comments` — 5/min/user

### 5c. Zod validation schemas

```ts
// src/lib/events/schemas.ts
const eventBaseSchema = z.object({
  title: z.string().min(3).max(140),
  summary: z.string().min(10).max(300),
  body: z.string().max(20000).optional(),
  coverImageUrl: z.string().url().optional(), //This should not be URL, it hsould ve media driven so that admin is able to select image from thier device and use it as teh voder image and undate it anythime
  coverImageAlt: z.string().max(200).optional(),
  communityLabel: z.string().max(60).optional(),
  location: z.string().max(200).optional(),
  scheduledAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  streamUrl: z.string().url().optional(),
  streamProvider: z.enum(['youtube', 'facebook']).optional(),
  isLive: z.boolean().optional(),
  engagementEnabled: z.boolean().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  sortOrder: z.number().int().optional(),
})

// Note: never call .partial() on a schema with .superRefine() — use separate base
export const createEventSchema = eventBaseSchema.extend({ slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/) })
export const updateEventSchema = eventBaseSchema.partial()

export const commentSchema = z.object({
  body: z.string().min(2).max(2000),
})
```

---

## 6. Admin UI (`/admin/events`)

### 6a. Page wrapper

**File**: `src/app/admin/events/page.tsx`

```tsx
// Same pattern as src/app/admin/gallery/page.tsx
export const dynamic = 'force-dynamic'

export default async function AdminEventsPage() {
  await requireAdminPageSession({ nextPath: '/admin/events' })
  const session = await getAdminSession()  // for role-based delete button visibility

  let events = []
  let loadWarning = null
  try { events = await getAllEvents() }
  catch (e) { loadWarning = logAdminPageLoadError({ page: 'admin.events', ... }, e) }

  return (
    <AdminContentContainer>
      <AdminPageHeader
        eyebrow="Content"
        title="Events"
        description="Schedule and manage community events — live streams, outreach drives, and broadcasts."
      />
      {loadWarning && <AdminDataLoadAlert ... />}
      <EventsBoard initialEvents={events} adminRole={session.role} hideHeader />
    </AdminContentContainer>
  )
}
```

### 6b. Board component

**File**: `src/components/admin/EventsBoard.tsx`

Follows identical structure to `GalleryImagesBoard.tsx` and `PodcastEpisodesBoard.tsx`:

- **List view**: cards with status badge, scheduled date, like count, comment count, stream indicator
- **Create/Edit drawer (full-screen modal)**:
  - Cover image upload with preview (camera badge pattern, `uploadAdminMediaAsset()`)
  - Auto-slug from title (locked on edit, Edit/Auto toggle on create)
  - All core fields: title, summary, body (textarea), community label, location, scheduled at (datetime-local input), stream URL, stream provider select
  - `isLive` toggle (amber badge pulsing when active)
  - Status dropdown: draft → published → archived
  - `engagementEnabled` toggle
  - Save / Cancel — POST on create, PUT on edit
- **Stream URL helper**: On paste of a YouTube `watch?v=` URL, auto-convert to embed URL; same for Facebook `/videos/` URLs
- **Comment moderation panel**: Within each event card, a "Comments" button opens a sub-panel listing all comments with hide/show/flag actions (PATCH call). Visible comment count shown in list.
- **Delete**: Only renders button if `adminRole === 'super_admin'` — confirmation modal required, no accidental deletes

### 6c. Nav entries

**`src/components/admin/AdminShell.tsx`** — add to Content group:
```tsx
{ href: '/admin/events', label: 'Events', icon: CalendarDays }
```
Import `CalendarDays` from `lucide-react`.

**`src/components/admin/AdminDashboardCards.tsx`** — add card:
```tsx
{
  label: 'Events',
  description: 'Schedule events, manage live streams, moderate community engagement.',
  icon: CalendarDays,
  href: '/admin/events',
  color: 'bg-sky-50 text-sky-700',
}
```

---

## 7. Public Events Page (`/events`)

### 7a. Route structure

```
src/app/events/
  page.tsx                  # Events index — hero + upcoming list
  [slug]/
    page.tsx                # Single event — full detail, stream embed, engagement
    loading.tsx             # Skeleton loading state
  loading.tsx               # Skeleton loading state
```

### 7b. Events index page — `src/app/events/page.tsx`

**Sections (top to bottom):**

1. **Hero** — primary-colour background, headline, tagline, accent CTA "See All Events" anchor
2. **Live Now Banner** (conditional) — only shown if any event has `isLive: true`. Pulsing red dot + "LIVE NOW" label + event title + "Watch Now" button that scrolls/routes to the event
3. **Featured/Upcoming card** — the next published event with a future `scheduledAt` is shown as a large hero card with cover image, title, summary, date, location, stream-available indicator, like/comment counts, and a "Watch Live" / "Set Reminder" CTA
4. **All Events grid** — responsive 3-column card grid of remaining published events, sorted: upcoming (nearest first), then past (most recent first). Each card shows: cover image, status dot (live/upcoming/past), title, date, community label, like count
5. **Load more** — if > 9 events, paginate via client-side fetch

**Metadata** (`generateMetadata`):
```ts
export const metadata: Metadata = {
  title: 'Events — DownBelow with Dr. Didi',
  description: 'Watch live, engage, and stay connected with community events from DownBelow Health Initiatives.',
  openGraph: { images: [{ url: coverImageUrl }] }
}
```

### 7c. Single event page — `src/app/events/[slug]/page.tsx`

**Sections:**

1. **Cover image header** — full-bleed image with gradient overlay, title and community label overlaid
2. **Event meta bar** — date, location, stream provider badge, like count, share count
3. **Stream Embed** (if `streamUrl` is set):
   - Full-width responsive embed (16:9 aspect ratio)
   - YouTube: `<iframe src="https://www.youtube.com/embed/{videoId}?autoplay=0&rel=0&modestbranding=1" ...>`
   - Facebook: `<iframe src="https://www.facebook.com/plugins/video.php?href={encodedUrl}&show_text=0" ...>`
   - Lazy-loaded with `loading="lazy"` + `title` for accessibility
   - "Live" pulsing badge overlaid on embed when `isLive: true`
4. **Body content** — full markdown-rendered event description
5. **Engagement bar** (if `engagementEnabled: true`):
   - `LikeButton` — heart icon + count, toggles on click (optimistic update), calls `POST/DELETE /api/events/[slug]/like`
   - `ShareMenu` — native share sheet on mobile (`navigator.share` API), fallback clipboard copy link + pre-filled social share links (WhatsApp, Twitter/X, Facebook)
   - Comment count badge with "Join conversation" anchor to `#comments`
6. **Comments section** (`#comments`):
   - Visible comments in chronological order — `displayName`, relative time (`formatDistanceToNow`), body
   - Comment form at bottom — `<textarea>` + Submit (requires user session; unauthenticated users see "Sign in to comment" prompt)
   - Optimistic UI: comment appears immediately while API call is in-flight

### 7d. Stream embed conversion utility

**File**: `src/lib/events/stream-utils.ts`

```ts
/**
 * Convert a public YouTube or Facebook video URL to an embeddable iframe src.
 * Returns null if the URL is not a recognisable video URL.
 */
export function toEmbedUrl(rawUrl: string, provider: 'youtube' | 'facebook'): string | null {
  if (provider === 'youtube') {
    // Handles: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/live/ID
    const match = rawUrl.match(/(?:v=|youtu\.be\/|\/live\/)([A-Za-z0-9_-]{11})/)
    return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1` : null
  }
  if (provider === 'facebook') {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(rawUrl)}&show_text=0&width=auto`
  }
  return null
}

export function detectStreamProvider(url: string): 'youtube' | 'facebook' | null {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube'
  if (/facebook\.com|fb\.watch/.test(url)) return 'facebook'
  return null
}
```

---

## 8. Engagement Components

### `LikeButton` — `src/components/events/LikeButton.tsx`

```tsx
// Client component
// Props: eventSlug, initialCount, initialLiked, disabled (when engagementEnabled=false)
// State: count, liked (optimistic)
// On click: call API, revert on error
// Renders: Heart icon (filled=liked, outline=not liked) + count + accessible label
```

### `ShareMenu` — `src/components/events/ShareMenu.tsx`

```tsx
// Client component
// Uses navigator.share() if available (mobile), else opens a small popover with:
//   - Copy link (clipboard.writeText)
//   - Share on WhatsApp (wa.me link)
//   - Share on X/Twitter (twitter.com/intent/tweet)
//   - Share on Facebook (facebook.com/sharer)
// Analytics: each share type logs a lightweight client-side event (no server call needed)
```

### `CommentForm` — `src/components/events/CommentForm.tsx`

```tsx
// Client component
// Shows sign-in CTA if no user session
// Controlled textarea with 2000-char counter
// Submit → POST /api/events/[slug]/comments
// On success: prepend comment to list optimistically
// Validation: min 2 chars, strip HTML tags on client before send
```

### `CommentThread` — `src/components/events/CommentThread.tsx`

```tsx
// Client component (initial data from server, progressive enhancement)
// Renders list of PublicCommentRecord
// Each comment: avatar initial circle (from displayName), displayName, relative time, body
// No nested replies in v1 — flat thread only
// "Load more" if > 20 comments
```

---

## 9. Audit Trail

Every admin write (create, update, delete, comment moderation) records an `AuditLog` entry:

```ts
await prisma.auditLog.create({
  data: {
    action: 'events.create' | 'events.update' | 'events.delete' | 'events.comment.moderate',
    targetId: event.id,
    performedBy: adminId,
    metadata: JSON.stringify({ title: event.title, changes: diff }),
  },
})
```

Admin can view the audit log at the bottom of the event detail drawer — same pattern as used in V-Vault moderation and user management.

---

## 10. Navigation Updates

### Public nav

The public site header already has a nav. Add an **Events** link:

- **File**: identify nav component (likely `src/components/Header.tsx` or similar)
- Add `{ href: '/events', label: 'Events' }` to the main nav array
- On mobile: ensure it appears in the hamburger sheet

### Admin nav

`AdminShell.tsx` — Content group already has: Settings, Team, Gallery, Podcast. Insert:
```tsx
{ href: '/admin/events', label: 'Events', icon: CalendarDays }
```

---

## 11. Implementation Sequence

Work in this order to keep the app deployable at every step, enforcing the professional standard of zero broken states in production:

### Phase 1 — Data layer (no UI yet, zero regressions)
1. Update `prisma/schema.prisma` with extended `OutreachEvent`, `EventLike`, `EventComment`, `CommentStatus` enum
2. Run `pnpm exec prisma migrate dev --name events_engagement`
3. Run `pnpm exec tsc --noEmit` — must be zero errors
4. Add admin repository functions to `src/lib/admin/repository.ts`
5. Create `src/lib/events/repository.ts` (public read functions)
6. Create `src/lib/events/schemas.ts` (Zod schemas)
7. Create `src/lib/events/stream-utils.ts`

### Phase 2 — Admin API
8. `src/app/api/admin/events/route.ts` (GET + POST)
9. `src/app/api/admin/events/[id]/route.ts` (PUT + DELETE)
10. `src/app/api/admin/events/[id]/comments/route.ts` (GET)
11. `src/app/api/admin/events/[id]/comments/[commentId]/route.ts` (PATCH)

### Phase 3 — Admin UI
12. `src/components/admin/EventsBoard.tsx`
13. `src/app/admin/events/page.tsx`
14. Add Events to `AdminShell` nav + `AdminDashboardCards`

### Phase 4 — Public API
15. `src/app/api/events/route.ts`
16. `src/app/api/events/[slug]/route.ts`
17. `src/app/api/events/[slug]/like/route.ts`
18. `src/app/api/events/[slug]/comments/route.ts`

### Phase 5 — Public UI
19. `src/components/events/LikeButton.tsx`
20. `src/components/events/ShareMenu.tsx`
21. `src/components/events/CommentForm.tsx`
22. `src/components/events/CommentThread.tsx`
23. `src/components/events/EventStreamEmbed.tsx`
24. `src/app/events/page.tsx` (index + hero)
25. `src/app/events/[slug]/page.tsx` (detail + embed + engagement)
26. `src/app/events/loading.tsx` + `src/app/events/[slug]/loading.tsx`

### Phase 6 — Navigation + polish
27. Add Events to public site header nav
28. SEO: `generateMetadata` with OG image for event detail
29. `robots.ts` and `sitemap.ts` — ensure `/events/**` is indexed
30. End-to-end smoke test: create event in admin → publish → view public → like → comment

---

## 12. Security Considerations

| Concern | Mitigation |
|---|---|
| Unauthenticated likes/comments | `POST /like` and `POST /comments` require valid user session cookie |
| Comment spam | Rate limiting: 5 comments/min/user; body sanitised server-side (strip HTML) |
| XSS in comment body | Sanitise on write (`<` → `&lt;` etc.); render with `whitespace-pre-wrap`, never `dangerouslySetInnerHTML` |
| Admin delete of live events | Confirm modal + `super_admin` role check in both UI and API route |
| Embed URL injection | Only YouTube and Facebook providers allowed; `toEmbedUrl()` validates known URL shapes; iframe `sandbox` attribute set |
| Admin impersonation on audit | `adminId` always taken from verified session, never from request body |

---

## 13. Key Design Decisions

1. **Extend `OutreachEvent` rather than create a new model** — the slug index, `PublicationStatus` enum, and migration chain already exist. Adding columns via `ALTER TABLE` is cheaper than a new join table.
2. **`isLive` is a manual toggle** — not computed from `scheduledAt`. Admin flips it when the stream goes live. This prevents false positives from timezone mismatches.
3. **Flat comment threads in v1** — no nested replies to keep moderation simple. Comments are ordered chronologically. Nested replies can be added in v2 by adding a `parentId` self-relation.
4. **Anonymous likes not implemented in v1** — `EventLike.userId` is required. Anonymous engagement adds privacy/dedup complexity; add in v2 with IP-hash dedup.
5. **Stream embed is a pure iframe** — no third-party SDK (`YouTube IFrame API`, `Facebook SDK`). This keeps CSP simpler and avoids tracking scripts. The YouTube embed URL supports `autoplay`, `loop`, and `controls` natively.
6. **`streamUrl` stored as raw user-provided URL in DB** — `toEmbedUrl()` is called at render time, not at write time. This lets us change the embed logic without a migration.
7. **Comment body stored as plain text** — no markdown in comments. Events body (admin-authored) can be markdown; comment body is plain text for safety.

---

## 14. Files Created / Modified Summary

### New files
```
prisma/migrations/YYYYMMDDHHMMSS_events_engagement/
src/lib/events/repository.ts
src/lib/events/schemas.ts
src/lib/events/stream-utils.ts
src/app/api/events/route.ts
src/app/api/events/[slug]/route.ts
src/app/api/events/[slug]/like/route.ts
src/app/api/events/[slug]/comments/route.ts
src/app/api/admin/events/route.ts
src/app/api/admin/events/[id]/route.ts
src/app/api/admin/events/[id]/comments/route.ts
src/app/api/admin/events/[id]/comments/[commentId]/route.ts
src/components/admin/EventsBoard.tsx
src/components/events/LikeButton.tsx
src/components/events/ShareMenu.tsx
src/components/events/CommentForm.tsx
src/components/events/CommentThread.tsx
src/components/events/EventStreamEmbed.tsx
src/app/events/page.tsx
src/app/events/loading.tsx
src/app/events/[slug]/page.tsx
src/app/events/[slug]/loading.tsx
```

### Modified files
```
prisma/schema.prisma               — extend OutreachEvent, add EventLike, EventComment
src/lib/admin/repository.ts        — add events CRUD functions + comment moderation
src/components/admin/AdminShell.tsx — add Events nav entry (CalendarDays icon)
src/components/admin/AdminDashboardCards.tsx — add Events card
src/app/robots.ts                  — ensure /events is in allow list
src/app/sitemap.ts                 — include published events slugs
```

---

## 15. Execution Status (2026-05-14)

### Completed in codebase

- Phase 1 complete (data + repositories + schemas/utilities)
  - `prisma/schema.prisma` includes extended `OutreachEvent`, `EventLike`, `EventComment`, and `CommentStatus`.
  - `src/lib/admin/repository.ts` includes event CRUD and comment moderation functions.
  - `src/lib/events/repository.ts` added for public read/engagement operations.
  - `src/lib/events/schemas.ts` and `src/lib/events/stream-utils.ts` added.

- Phase 2 complete (admin APIs)
  - `src/app/api/admin/events/route.ts` (GET, POST)
  - `src/app/api/admin/events/[id]/route.ts` (PUT, DELETE)
  - `src/app/api/admin/events/[id]/comments/route.ts` (GET)
  - `src/app/api/admin/events/[id]/comments/[commentId]/route.ts` (PATCH)

- Phase 3 complete (admin UI and navigation)
  - `src/components/admin/EventsBoard.tsx` added (create/edit/list/delete + comment moderation modal)
  - `src/app/admin/events/page.tsx` added with guarded loading and fallback alert.
  - `src/components/admin/AdminShell.tsx` updated with `/admin/events` nav entry.
  - `src/components/admin/AdminDashboardCards.tsx` updated with Events card and `outreachEvents` metric.
  - `src/components/admin/AdminUploadModal.tsx` updated with Events destination.

- Phase 4 complete (public APIs)
  - `src/app/api/events/route.ts` (GET published events)
  - `src/app/api/events/[slug]/route.ts` (GET single published event)
  - `src/app/api/events/[slug]/like/route.ts` (POST/DELETE like with authenticated user session)
  - `src/app/api/events/[slug]/comments/route.ts` (GET visible comments, POST comment with authenticated user session)

- Phase 5 complete (public events UI)
  - `src/components/events/LikeButton.tsx` added with optimistic like/unlike UX and auth fallback.
  - `src/components/events/ShareMenu.tsx` added with native share + clipboard/social fallback.
  - `src/components/events/CommentForm.tsx` added with authenticated posting and optimistic comment insertion.
  - `src/components/events/CommentThread.tsx` added with live optimistic thread updates.
  - `src/components/events/EventStreamEmbed.tsx` added for safe YouTube/Facebook iframe rendering.
  - `src/app/events/page.tsx` added (hero, featured event, live-now banner, event grid).
  - `src/app/events/[slug]/page.tsx` added (detail layout, stream embed, engagement bar, comments section).
  - `src/app/events/loading.tsx` and `src/app/events/[slug]/loading.tsx` added.

- Phase 6 complete (navigation + polish, except E2E smoke)
  - `src/components/layout/Navbar.tsx` updated with public `Events` nav link.
  - `src/components/layout/Footer.tsx` quick links updated to include `Events`.
  - `src/app/events/[slug]/page.tsx` metadata upgraded with explicit OG/Twitter image fallback.
  - `src/app/robots.ts` updated to explicitly allow `/events` crawling.
  - `src/app/sitemap.ts` updated to include `/events` and dynamic `/events/[slug]` entries.
  - E2E smoke path (admin create/publish -> public view -> like -> comment) is blocked until DB connectivity is restored.

### Validation status

- TypeScript status: `pnpm exec tsc --noEmit` exits with code `0`.

### Environment blocker still present

- `pnpm exec prisma migrate dev --name events_engagement` is blocked by DB connectivity (`P1001`, Cockroach host unreachable from current environment).
- Live remediation run confirms the first failing step is DNS:
  - Command: `Resolve-DnsName down-below-15388.jxf.gcp-europe-west3.cockroachlabs.cloud`
  - Result: `DNS server failure.`
- To keep the branch deploy-ready, a migration file was added manually:
  - `prisma/migrations/20260514123000_events_engagement/migration.sql`

### Next step (when DB is reachable)

1. Re-run `Resolve-DnsName down-below-15388.jxf.gcp-europe-west3.cockroachlabs.cloud` until DNS passes.
2. Continue remediation sequence (`Test-NetConnection`, `pnpm exec prisma db pull`, then `pnpm exec prisma migrate dev --name events_engagement`).
3. Run Phase 6 smoke test flow: admin create/publish event -> public view -> like -> comment.

### P1001 Remediation Plan (exact actions)

The current environment is **not fully offline**:
- DNS resolution works for `down-below-15388.jxf.gcp-europe-west3.cockroachlabs.cloud`
- TCP connectivity to port `26257` succeeds
- `pnpm exec prisma db pull` succeeds

But Prisma migration commands intermittently fail with `P1001`.

Exact fix sequence to execute:

1. **Stabilize runtime context**
  - Run from project root only: `C:\Users\KING MADU\Documents\down-below-with-dr-didi`
  - Disable transient network modifiers for the run (VPN/proxy switching) to avoid intermittent DNS/TCP resets during schema engine startup.

2. **Verify DB endpoint before migrate**
  - `Resolve-DnsName down-below-15388.jxf.gcp-europe-west3.cockroachlabs.cloud`
  - `Test-NetConnection down-below-15388.jxf.gcp-europe-west3.cockroachlabs.cloud -Port 26257`
  - Pass criteria: DNS resolves and `TcpTestSucceeded : True`

3. **Verify Prisma engine connectivity**
  - `pnpm exec prisma db pull`
  - Pass criteria: introspection succeeds without `P1001`

4. **Run migration immediately after successful introspection**
  - `pnpm exec prisma migrate dev --name events_engagement`

5. **If `P1001` persists, harden connection timeout in `.env`**
  - Update `DATABASE_URL` by appending: `&connect_timeout=30`
  - Example shape (credentials unchanged):
    - `postgresql://...:26257/down_below_app?sslmode=verify-full&connect_timeout=30`
  - Then rerun steps 3 and 4.

6. **Post-fix verification**
  - `pnpm exec prisma generate`
  - `pnpm exec tsc --noEmit`
  - Pass criteria: both commands exit `0`.

---

*Plan authored — Down Below with Dr. Didi · Events System v1.0*

# Podcast Page Plan

> **Goal:** Add a simple, professional podcast experience for both public visitors and admins.

## Public Experience

### `/podcast`

The public page should be mobile-first and easy to scan.

Recommended layout:
- Short hero with one accented keyword.
- One-line description only.
- Episode list with cover art, title, duration, date, and a short summary.
- Inline audio player for each episode.
- Download button for each episode.
- Optional topic chips when the library grows.

### Episode detail

If the content library grows, add `/podcast/[slug]` later for a single episode page.

That page should include:
- Full title and episode art.
- Embedded player.
- Download link.
- Transcript or show notes.
- Related episodes.

## Admin Experience

### `/admin/podcast`

The admin page should support:
- Episode list with publish status.
- Create, edit, and delete actions.
- Audio upload.
- Cover art upload or image URL.
- Duration, publish date, slug, and summary fields.

### Episode form fields

Minimum fields:
- Title
- Slug
- Summary
- Description or show notes
- Audio file
- Cover image
- Duration
- Publish status
- Published date
- Sort order

Optional fields:
- Guest name
- Topic tags
- Transcript
- External source link

## Data Model

Suggested model:

```prisma
model PodcastEpisode {
  id          String            @id @default(cuid())
  slug        String            @unique
  title       String
  summary     String
  description String
  audioUrl    String
  audioSize   Int?
  audioType   String?
  duration    Int?
  coverImage  String?
  guestName   String?
  publishedAt DateTime?
  sortOrder   Int               @default(0)
  status      PublicationStatus @default(published)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}
```

## Repository and API

Add repository methods for:
- `getPublishedPodcastEpisodes()`
- `getAllPodcastEpisodes()`
- `getPodcastEpisodeBySlug()`
- `createPodcastEpisode()`
- `updatePodcastEpisode()`
- `deletePodcastEpisode()`

Add API routes for:
- `GET /api/admin/podcast`
- `POST /api/admin/podcast`
- `PUT /api/admin/podcast/[id]`
- `DELETE /api/admin/podcast/[id]`

Public routes:
- `GET /podcast`
- `GET /podcast/[slug]` if detail pages are added

## Media Handling

Audio should be stored in object storage, not in the repo.

Recommended flow:
- Upload audio from admin.
- Store the file in S3 or R2-compatible storage.
- Save the public URL in the database.
- Expose a direct download link and a browser player URL.

## UX Rules

- Keep the hero copy short.
- Prioritise touch targets and readable controls.
- Make download and play actions obvious and separate.
- Avoid cluttered metadata in the hero area.
- Ensure the episode list remains usable on small screens.

## Implementation Order

1. Add schema and migration.
2. Add repository methods.
3. Add admin routes and forms.
4. Add public listing page.
5. Add upload and download flow.
6. Add validation and build checks.

## Success Criteria

- Users can play episodes directly in the browser.
- Users can download episodes from the same page.
- Admins can publish and manage episodes without code changes.
- The page remains simple, fast, and mobile-friendly.

## Implementation Status - 2026-05-09

Completed:
- Added `PodcastEpisode` Prisma model and migration.
- Added repository methods for published, admin list, slug lookup, create, update, and delete.
- Added admin API routes at `/api/admin/podcast` and `/api/admin/podcast/[id]`.
- Added `/admin/podcast` for create, edit, delete, publish status, audio upload, cover upload, show notes, transcript, tags, and metadata.
- Added public `/podcast` listing with inline audio players and download links.
- Added public `/podcast/[slug]` detail pages with player, download, show notes, transcript, and related episodes.
- Added Podcast links to the public navigation, footer, and admin dashboard.
- Extended media uploads to classify `audio/*` files as audio assets.

Activation requirement:
- Run the new Prisma migration in the target environment before using admin podcast CRUD against the database.

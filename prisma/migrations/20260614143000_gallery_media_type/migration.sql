CREATE TYPE "GalleryMediaType" AS ENUM ('image', 'video');

ALTER TABLE "GalleryImage"
ADD COLUMN "mediaType" "GalleryMediaType" NOT NULL DEFAULT 'image',
ADD COLUMN "featured" BOOL NOT NULL DEFAULT false;

CREATE INDEX "GalleryImage_featured_sortOrder_createdAt_idx" ON "GalleryImage" ("featured", "sortOrder", "createdAt");

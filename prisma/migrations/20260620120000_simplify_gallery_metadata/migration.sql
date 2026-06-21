-- Drop the index that depends on the retired sortOrder column.
DROP INDEX "GalleryImage_featured_sortOrder_createdAt_idx";

-- Gallery media is ordered by featured state and creation time. The remaining
-- metadata is maintained by the simplified admin upload flow.
ALTER TABLE "GalleryImage" DROP COLUMN "caption";
ALTER TABLE "GalleryImage" DROP COLUMN "capturedAt";
ALTER TABLE "GalleryImage" DROP COLUMN "eventName";
ALTER TABLE "GalleryImage" DROP COLUMN "location";
ALTER TABLE "GalleryImage" DROP COLUMN "sortOrder";

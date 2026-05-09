-- AlterEnum
ALTER TYPE "MediaAssetKind" ADD VALUE 'audio';

-- CreateTable
CREATE TABLE "PodcastEpisode" (
    "id" STRING NOT NULL,
    "slug" STRING NOT NULL,
    "title" STRING NOT NULL,
    "summary" STRING NOT NULL,
    "description" STRING NOT NULL,
    "audioUrl" STRING NOT NULL,
    "audioSize" INT4,
    "audioType" STRING,
    "duration" INT4,
    "coverImage" STRING,
    "guestName" STRING,
    "topicTags" JSONB,
    "transcript" STRING,
    "externalSourceUrl" STRING,
    "publishedAt" TIMESTAMP(3),
    "sortOrder" INT4 NOT NULL DEFAULT 0,
    "status" "PublicationStatus" NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PodcastEpisode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PodcastEpisode_slug_key" ON "PodcastEpisode"("slug");

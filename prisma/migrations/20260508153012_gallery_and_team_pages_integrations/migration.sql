-- CreateEnum
CREATE TYPE "TeamTier" AS ENUM ('founder', 'leadership', 'core');

-- CreateEnum
CREATE TYPE "GalleryCategory" AS ENUM ('outreach', 'event', 'team', 'community', 'facility');

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" STRING NOT NULL,
    "slug" STRING NOT NULL,
    "name" STRING NOT NULL,
    "role" STRING NOT NULL,
    "tier" "TeamTier" NOT NULL,
    "sortOrder" INT4 NOT NULL DEFAULT 0,
    "credentials" STRING NOT NULL,
    "bio" STRING NOT NULL,
    "imageUrl" STRING,
    "imageAlt" STRING,
    "status" "PublicationStatus" NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryImage" (
    "id" STRING NOT NULL,
    "slug" STRING NOT NULL,
    "title" STRING NOT NULL,
    "description" STRING NOT NULL,
    "caption" STRING,
    "imageUrl" STRING NOT NULL,
    "imageAlt" STRING NOT NULL,
    "category" "GalleryCategory" NOT NULL,
    "eventName" STRING,
    "location" STRING,
    "capturedAt" TIMESTAMP(3),
    "status" "PublicationStatus" NOT NULL DEFAULT 'published',
    "sortOrder" INT4 NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_slug_key" ON "TeamMember"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "GalleryImage_slug_key" ON "GalleryImage"("slug");

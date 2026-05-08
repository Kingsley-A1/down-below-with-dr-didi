-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('super_admin', 'editor', 'moderator');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "MediaAssetKind" AS ENUM ('image', 'document', 'video', 'other');

-- CreateEnum
CREATE TYPE "VaultSubmissionStatus" AS ENUM ('new', 'reviewed', 'answered_privately', 'approved_for_faq', 'archived');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" STRING NOT NULL,
    "email" STRING NOT NULL,
    "name" STRING,
    "role" "AdminRole" NOT NULL,
    "isActive" BOOL NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" STRING NOT NULL,
    "scope" STRING NOT NULL DEFAULT 'global',
    "siteName" STRING NOT NULL,
    "tagline" STRING NOT NULL,
    "motto" STRING NOT NULL,
    "siteUrl" STRING NOT NULL,
    "primaryWhatsapp" STRING NOT NULL,
    "contactEmail" STRING NOT NULL,
    "heroHeadline" STRING NOT NULL,
    "heroBody" STRING NOT NULL,
    "heroImageUrl" STRING,
    "heroImageAlt" STRING,
    "footerBlurb" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" STRING,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" STRING NOT NULL,
    "label" STRING NOT NULL,
    "storageKey" STRING NOT NULL,
    "bucket" STRING NOT NULL,
    "url" STRING NOT NULL,
    "mimeType" STRING NOT NULL,
    "sizeBytes" INT4 NOT NULL,
    "kind" "MediaAssetKind" NOT NULL,
    "altText" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" STRING,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" STRING NOT NULL,
    "action" STRING NOT NULL,
    "entityType" STRING NOT NULL,
    "entityId" STRING,
    "actorEmail" STRING NOT NULL,
    "actorRole" "AdminRole" NOT NULL,
    "summary" STRING NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" STRING,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultSubmission" (
    "id" STRING NOT NULL,
    "category" STRING NOT NULL,
    "question" STRING NOT NULL,
    "status" "VaultSubmissionStatus" NOT NULL DEFAULT 'new',
    "moderationNotes" STRING,
    "approvedFaqTitle" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaultSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" STRING NOT NULL,
    "slug" STRING NOT NULL,
    "title" STRING NOT NULL,
    "excerpt" STRING NOT NULL,
    "content" STRING NOT NULL,
    "category" STRING NOT NULL,
    "coverImageUrl" STRING,
    "readTime" INT4 NOT NULL DEFAULT 5,
    "status" "PublicationStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachEvent" (
    "id" STRING NOT NULL,
    "slug" STRING NOT NULL,
    "title" STRING NOT NULL,
    "summary" STRING NOT NULL,
    "body" STRING,
    "coverImageUrl" STRING,
    "communityLabel" STRING,
    "status" "PublicationStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSettings_scope_key" ON "SiteSettings"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachEvent_slug_key" ON "OutreachEvent"("slug");

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

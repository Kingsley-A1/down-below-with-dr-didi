-- CreateEnum
CREATE TYPE "ReviewSource" AS ENUM ('public_submission', 'admin_created', 'seed');

-- CreateTable
CREATE TABLE "Review" (
    "id" STRING NOT NULL,
    "displayName" STRING NOT NULL,
    "roleLabel" STRING,
    "location" STRING,
    "rating" INT4 NOT NULL DEFAULT 5,
    "body" STRING NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'draft',
    "source" "ReviewSource" NOT NULL DEFAULT 'public_submission',
    "sortOrder" INT4 NOT NULL DEFAULT 0,
    "userId" STRING,
    "adminReply" STRING,
    "adminReplyAuthorEmail" STRING,
    "adminRepliedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewHelpful" (
    "id" STRING NOT NULL,
    "reviewId" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewHelpful_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_status_sortOrder_createdAt_idx" ON "Review"("status", "sortOrder", "createdAt");

-- CreateIndex
CREATE INDEX "Review_userId_createdAt_idx" ON "Review"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewHelpful_reviewId_userId_key" ON "ReviewHelpful"("reviewId", "userId");

-- CreateIndex
CREATE INDEX "ReviewHelpful_reviewId_idx" ON "ReviewHelpful"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewHelpful_userId_idx" ON "ReviewHelpful"("userId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewHelpful" ADD CONSTRAINT "ReviewHelpful_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewHelpful" ADD CONSTRAINT "ReviewHelpful_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

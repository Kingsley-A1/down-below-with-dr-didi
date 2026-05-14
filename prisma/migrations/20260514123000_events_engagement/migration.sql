-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('visible', 'hidden', 'flagged');

-- AlterTable
ALTER TABLE "OutreachEvent"
ADD COLUMN "coverImageAlt" STRING,
ADD COLUMN "location" STRING,
ADD COLUMN "scheduledAt" TIMESTAMP(3),
ADD COLUMN "endedAt" TIMESTAMP(3),
ADD COLUMN "streamUrl" STRING,
ADD COLUMN "streamProvider" STRING,
ADD COLUMN "isLive" BOOL NOT NULL DEFAULT false,
ADD COLUMN "engagementEnabled" BOOL NOT NULL DEFAULT true,
ADD COLUMN "sortOrder" INT4 NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "EventLike" (
    "id" STRING NOT NULL,
    "eventId" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventComment" (
    "id" STRING NOT NULL,
    "eventId" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "displayName" STRING NOT NULL,
    "body" STRING NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'visible',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutreachEvent_status_scheduledAt_idx" ON "OutreachEvent"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "OutreachEvent_sortOrder_createdAt_idx" ON "OutreachEvent"("sortOrder", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventLike_eventId_userId_key" ON "EventLike"("eventId", "userId");

-- CreateIndex
CREATE INDEX "EventLike_eventId_idx" ON "EventLike"("eventId");

-- CreateIndex
CREATE INDEX "EventLike_userId_idx" ON "EventLike"("userId");

-- CreateIndex
CREATE INDEX "EventComment_eventId_status_createdAt_idx" ON "EventComment"("eventId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "EventComment_userId_createdAt_idx" ON "EventComment"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "EventLike" ADD CONSTRAINT "EventLike_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "OutreachEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventLike" ADD CONSTRAINT "EventLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventComment" ADD CONSTRAINT "EventComment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "OutreachEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventComment" ADD CONSTRAINT "EventComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

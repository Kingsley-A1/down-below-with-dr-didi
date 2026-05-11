-- CreateTable
CREATE TABLE "SiteAlert" (
    "id" STRING NOT NULL,
    "text" STRING NOT NULL,
    "speed" INT4 NOT NULL DEFAULT 100,
    "durationSeconds" INT4 NOT NULL DEFAULT 22,
    "isActive" BOOL NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteAlert_isActive_startsAt_endsAt_idx" ON "SiteAlert"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "SiteAlert_createdAt_idx" ON "SiteAlert"("createdAt");

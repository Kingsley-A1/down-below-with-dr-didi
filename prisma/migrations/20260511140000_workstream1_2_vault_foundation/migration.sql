-- Workstream 1: RBAC foundation
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'founder_admin';

-- Workstream 2: Vault data model foundation
CREATE TYPE "VaultSubmissionSource" AS ENUM ('app_authenticated', 'whatsapp_import', 'manual_admin');
CREATE TYPE "VaultActorType" AS ENUM ('user', 'admin', 'system');

ALTER TABLE "VaultSubmission"
  ADD COLUMN "source" "VaultSubmissionSource" NOT NULL DEFAULT 'app_authenticated',
  ADD COLUMN "userId" STRING;

CREATE TABLE "VaultResponse" (
  "id" STRING NOT NULL,
  "submissionId" STRING NOT NULL,
  "responseBody" STRING NOT NULL,
  "responderAdminId" STRING,
  "responderRole" "AdminRole" NOT NULL,
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "VaultResponse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserNotification" (
  "id" STRING NOT NULL,
  "userId" STRING NOT NULL,
  "type" STRING NOT NULL,
  "title" STRING NOT NULL,
  "body" STRING NOT NULL,
  "entityType" STRING,
  "entityId" STRING,
  "isRead" BOOL NOT NULL DEFAULT false,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VaultSubmissionEvent" (
  "id" STRING NOT NULL,
  "submissionId" STRING NOT NULL,
  "actorType" "VaultActorType" NOT NULL,
  "actorUserId" STRING,
  "actorAdminId" STRING,
  "eventType" STRING NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "VaultSubmissionEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VaultSubmission_createdAt_idx" ON "VaultSubmission"("createdAt");
CREATE INDEX "VaultSubmission_status_createdAt_idx" ON "VaultSubmission"("status", "createdAt");
CREATE INDEX "VaultSubmission_userId_createdAt_idx" ON "VaultSubmission"("userId", "createdAt");
CREATE INDEX "VaultResponse_submissionId_createdAt_idx" ON "VaultResponse"("submissionId", "createdAt");
CREATE INDEX "VaultResponse_responderAdminId_idx" ON "VaultResponse"("responderAdminId");
CREATE INDEX "UserNotification_userId_isRead_createdAt_idx" ON "UserNotification"("userId", "isRead", "createdAt");
CREATE INDEX "UserNotification_entityType_entityId_idx" ON "UserNotification"("entityType", "entityId");
CREATE INDEX "VaultSubmissionEvent_submissionId_createdAt_idx" ON "VaultSubmissionEvent"("submissionId", "createdAt");
CREATE INDEX "VaultSubmissionEvent_actorType_createdAt_idx" ON "VaultSubmissionEvent"("actorType", "createdAt");

ALTER TABLE "VaultSubmission"
  ADD CONSTRAINT "VaultSubmission_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VaultResponse"
  ADD CONSTRAINT "VaultResponse_submissionId_fkey"
  FOREIGN KEY ("submissionId") REFERENCES "VaultSubmission"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VaultResponse"
  ADD CONSTRAINT "VaultResponse_responderAdminId_fkey"
  FOREIGN KEY ("responderAdminId") REFERENCES "AdminUser"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserNotification"
  ADD CONSTRAINT "UserNotification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VaultSubmissionEvent"
  ADD CONSTRAINT "VaultSubmissionEvent_submissionId_fkey"
  FOREIGN KEY ("submissionId") REFERENCES "VaultSubmission"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VaultSubmissionEvent"
  ADD CONSTRAINT "VaultSubmissionEvent_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VaultSubmissionEvent"
  ADD CONSTRAINT "VaultSubmissionEvent_actorAdminId_fkey"
  FOREIGN KEY ("actorAdminId") REFERENCES "AdminUser"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

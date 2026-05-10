-- AlterTable: Add account lockout fields for Phase 4 security
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INT4 NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockoutUntil" TIMESTAMP(3);

-- Create indexes for better query performance (Phase 4)
CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

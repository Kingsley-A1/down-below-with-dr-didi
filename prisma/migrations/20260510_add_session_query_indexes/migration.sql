-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_user_isActive" ON "User" ("isActive");
CREATE INDEX IF NOT EXISTS "idx_user_role" ON "User" ("role");
CREATE INDEX IF NOT EXISTS "idx_user_lastActivityAt" ON "User" ("lastActivityAt");

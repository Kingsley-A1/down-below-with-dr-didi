-- AlterTable: Add email verification token expiry for P1 security enforcement
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifyTokenExpiry" TIMESTAMP(3);

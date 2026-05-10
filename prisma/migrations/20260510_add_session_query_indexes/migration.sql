-- AlterTable
ALTER TABLE "User" ADD INDEX idx_user_isActive (isActive);
ALTER TABLE "User" ADD INDEX idx_user_role (role);
ALTER TABLE "User" ADD INDEX idx_user_lastActivityAt (lastActivityAt);

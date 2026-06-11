-- Email verification moves from link-based unique tokens to short, per-account
-- 6-digit codes. A 6-digit code is not globally unique, so the unique indexes
-- that backed the old tokens must be dropped; verification now looks up the
-- account by email and compares the stored code.

-- User.emailVerifyToken: drop the unique index (now stores a 6-digit code).
DROP INDEX IF EXISTS "User_emailVerifyToken_key" CASCADE;

-- AdminUser.emailVerifyToken: drop the unique index (now stores a 6-digit code).
DROP INDEX IF EXISTS "AdminUser_emailVerifyToken_key" CASCADE;

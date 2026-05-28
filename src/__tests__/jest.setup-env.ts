import { loadEnvConfig } from '@next/env'

// Ensure Jest picks up .env / .env.local for modules that read process.env at import time.
loadEnvConfig(process.cwd())

// Tests must run with deterministic admin auth env regardless of the developer's
// local .env (which may have role codes that collide with our test fixtures).
// We force-overwrite the admin env vars here to known values; this only affects
// process.env inside the Jest worker, not the developer's .env file.
const TEST_OVERRIDES: Record<string, string> = {
  ADMIN_SESSION_SECRET: 'test-admin-session-secret-not-for-production-use',
  ADMIN_ACCESS_CODE: '910111',
  ADMIN_SUPER_ADMIN_ACCESS_CODE: '910112',
  ADMIN_FOUNDER_ADMIN_ACCESS_CODE: '910113',
  ADMIN_EDITOR_ACCESS_CODE: '910114',
  ADMIN_SUPPORT_PHONE: '+2348012345678',
  ADMIN_ALLOWED_USERS: [
    'goodeals.ng@gmail.com:editor|super_admin',
    'deblessedking001@gmail.com:super_admin',
    'super-admin@example.com:super_admin',
  ].join(','),
  ADMIN_INVITE_TOKENS: 'invitee@example.com:moderator:test-invite-token-123456',
  JWT_SECRET: 'test-jwt-secret-not-for-production-use-32chars+',
  NEXT_PUBLIC_SITE_URL: 'https://test.down-below.local',
}

for (const [key, value] of Object.entries(TEST_OVERRIDES)) {
  process.env[key] = value
}

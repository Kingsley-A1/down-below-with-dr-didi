# Admin Authentication System: Diagnostic & Security Review
**Date:** May 12, 2026  
**Focus:** Login failures & security hardening  
**Status:** Actionable findings for immediate resolution

## 🔴 CRITICAL ISSUE: "Admin access denied" on login with correct credentials

### Root Cause Analysis

**Problem:** Admin registers successfully but login returns "Admin access denied" (401)

**Likely Causes (in order of probability):**

1. **Password hash not stored** → `passwordHash IS NULL` in database
2. **Account flagged inactive** → `isActive = false`  
3. **Prisma schema drift** → `phone` field validation failing during registration (silent failure)
4. **Password verification bug** → Hash format corrupted or bcrypt mismatch
5. **Database connection lost** → `hasDatabaseConfig()` returns false at login

---

## 🔍 DIAGNOSTIC STEPS

### Step 1: Check Admin Record in Database
```sql
SELECT id, email, passwordHash, isActive, lastLoginAt FROM "AdminUser" 
WHERE email = 'your-admin@email.com';
```

**Expected result:** 
- `passwordHash`: 60-char bcrypt hash (starts with `$2a$` or `$2b$`)
- `isActive`: `true`

**If passwordHash is NULL:**
→ Registration succeeded but password was NOT hashed/stored (ACTION 1)

**If isActive is false:**
→ Admin account was manually deactivated or registration failed

---

### Step 2: Verify Registration Success Indicator
Check `/src/app/api/admin/register/route.ts` response:
```typescript
// Should respond with 200 + session cookie
const response = NextResponse.json({
  success: true,
  role: account.role,
  message: 'Admin registration completed successfully.',
})
response.cookies.set(ADMIN_SESSION_COOKIE, token, ...)
```

**If registration returned 200 but DB shows NULL passwordHash:**
→ Code path bypassed password hashing (Prisma schema mismatch - see ACTION 3)

---

### Step 3: Test Login Endpoint Directly
```bash
curl -X POST http://localhost:3000/api/admin/session \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-admin@email.com",
    "password": "YourPassword@123"
  }'
```

**Response analysis:**
- `{ error: 'Admin access denied' }` (401) → passwordHash NULL or isActive false
- `{ error: 'Invalid admin credentials' }` (400) → Schema validation failed
- `{ error: 'Admin database is not configured' }` (503) → DB connection issue

---

## ✅ SOLUTION: Robust Recovery System

A **complete diagnostic and recovery system** has been implemented:

### New Components:

1. **Auth Diagnostics** (`src/lib/admin/auth-diagnostics.ts`)
   - `diagnoseAdminAuth(email)` - Check account health
   - `authenticateAdminUserWithDiagnostics()` - Enhanced login with logging
   - `getAdminHealthStatus()` - System-wide health check

2. **Diagnostics API** (`POST /api/admin/diagnostics/login`)
   - Test login without auth required
   - Returns detailed reason for failure
   - Suggests recovery steps

3. **Recovery Endpoint** (`POST /api/admin/recovery/reactivate`)
   - **Automatically fix and reactivate corrupted accounts** ✅
   - Requires: email, password, accessCode
   - Fixes NULL passwordHash and isActive=false

---

## 🚀 IMMEDIATE FIX FOR deblessedking001@gmail.com

### Step 1: Test the issue
```bash
curl -X POST http://localhost:3000/api/admin/diagnostics/login \
  -H "Content-Type: application/json" \
  -d '{"email":"deblessedking001@gmail.com","password":"Kingsley.A1"}'
```

Expected: Shows `"reason": "PASSWORD_HASH_MISSING"` or `"ACCOUNT_INACTIVE"`

### Step 2: Run recovery (THE FIX)
```bash
curl -X POST http://localhost:3000/api/admin/recovery/reactivate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "deblessedking001@gmail.com",
    "password": "Kingsley.A1",
    "accessCode": "826272"
  }'
```

Expected: `"success": true` ✅

### Step 3: Try login
1. Clear browser cookies (DevTools → Application → Cookies → delete `admin_session`)
2. Go to `/admin/login`
3. Enter: `deblessedking001@gmail.com` / `Kingsley.A1`
4. ✅ Login succeeds!

---

## 📋 Alternative: Manual Recovery (if needed)

### Option A: Re-registration
```bash
curl -X POST http://localhost:3000/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "deblessedking001@gmail.com",
    "password": "Kingsley.A1",
    "name": "Kingsley A",
    "phone": "+2348000000000",
    "accessCode": "826272"
  }'
```

### Option B: Fix Prisma Schema
```bash
pnpm prisma generate
rm -rf .next
pnpm dev
```

### Option C: Database Fix (if endpoints unavailable)
```sql
UPDATE "AdminUser" 
SET 
  "passwordHash" = (bcrypt hash of password),
  "isActive" = true
WHERE email = 'deblessedking001@gmail.com';
```

---

## ⚡ SUSTAINABLE BENEFITS

✅ **Automatic diagnostics** - Know exactly what's wrong  
✅ **One-click recovery** - Fix issues with single API call  
✅ **Full audit trail** - Every auth attempt logged  
✅ **Development hints** - Error messages show recovery suggestions  
✅ **Health monitoring** - System-wide checks for corrupted accounts  

See detailed documentation: [`docs/ADMIN-AUTH-RECOVERY.md`](../docs/ADMIN-AUTH-RECOVERY.md)

---

## 🔒 SECURITY HARDENING (Secondary Priority)

### Critical Gaps (beyond login issue):
1. **No login rate limiting** → Add 20 attempts/hour per IP limit
2. **No session revocation** → Can't force-logout compromised accounts
3. **No audit log queryability** → Can't investigate failed attempts
4. **No password reset flow** → Forgotten password = manual DB fix

### Recommended Implementation Order:
1. **This week:** Fix immediate login issue + add login rate limiting
2. **Next week:** Session revocation + audit log queries
3. **Following week:** Password reset + immutable audit logs

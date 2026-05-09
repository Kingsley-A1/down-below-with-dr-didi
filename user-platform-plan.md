# User Registration & Account Management Platform Plan

**Date:** May 9, 2026  
**Status:** Planning  
**Priority:** High (Foundation for community features)

---

## 1. Overview

Enable public user registration, authentication, and self-service account management with full admin oversight via audit trails.

### User Flows
- **New User:** `/register` → email verification → `/me` profile
- **Existing User:** `/login` → `/me` profile (optional, auth can be register-only)
- **Admin:** `/admin/users` (list) → `/admin/users/[slug]` (detail + audit log)

---

## 2. Database Schema

### New Model: `User`
```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  displayName       String
  passwordHash      String
  isActive          Boolean   @default(true)
  emailVerified     Boolean   @default(false)
  emailVerifyToken  String?   @unique
  resetToken        String?   @unique
  resetTokenExpiry  DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  auditLogs         AuditLog[]
}
```

### Extend Model: `AuditLog`
```prisma
// Add to existing AuditLog:
userId            String?
user              User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
action            String    // 'user.register', 'user.login', 'user.update', 'user.delete'
ipAddress         String?
userAgent         String?
success           Boolean   @default(true)
```

### Extend Model: `AdminUser`
```prisma
// Add optional link (if admin should also be a User)
// OR keep separate (recommended for admin-only accounts)
```

---

## 3. API Routes

### Public Routes (No Auth Required)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/register` | POST | Create new user, send email verification |
| `/api/auth/verify-email` | POST | Confirm email with token |
| `/api/auth/login` | POST | Authenticate user, return session/token |
| `/api/auth/logout` | POST | Clear session |
| `/api/auth/forgot-password` | POST | Send password reset email |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/auth/session` | GET | Check current session status |

### Protected Routes (User Auth Required)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/users/me` | GET | Fetch current user profile |
| `/api/users/me` | PUT | Update user profile |
| `/api/users/me/password` | PUT | Change password |

### Admin Routes (Admin Auth Required)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/users` | GET | List all users with pagination |
| `/api/admin/users/[id]` | GET | User details + audit logs |
| `/api/admin/users/[id]/deactivate` | POST | Deactivate user |
| `/api/admin/users/[id]/activate` | POST | Reactivate user |

---

## 4. Frontend Pages

### Public Pages
| Page | Route | Auth | Purpose |
|------|-------|------|---------|
| Register | `/register` | No | Sign up form (email, name, password) |
| Login | `/login` | No | Sign in form (optional; can use register-only) |
| Verify Email | `/verify-email` | No | Email confirmation UI (token in URL) |
| Forgot Password | `/forgot-password` | No | Email input, sends reset link |
| Reset Password | `/reset-password` | No | New password form (token in URL) |

### Protected Pages (User Auth Required)
| Page | Route | Purpose |
|------|-------|---------|
| My Account | `/me` | Profile view/edit, activity summary, password change |

### Admin Pages (Admin Auth Required)
| Page | Route | Purpose |
|------|-------|---------|
| Users List | `/admin/users` | Paginated table, search, status filters, bulk actions |
| User Detail | `/admin/users/[slug]` | Profile, audit log, deactivate/activate toggle |

---

## 5. Authentication Strategy

### Session Management
- **Method:** Next.js cookie-based session (same pattern as `/admin`)
- **Session Structure:** `{ userId, email, displayName, isVerified }`
- **Cookie:** `user_session` (httpOnly, secure, sameSite=Strict)
- **Duration:** 7 days (extendable on activity)

### Password Security
- **Hashing:** `bcrypt` (already in use for admin)
- **Validation:** Min 8 chars, uppercase, number, special char
- **Strength Meter:** Show on register/change password UI

### Email Verification
- **Token:** 32-char random, stored in DB with 24h expiry
- **Flow:** Register → email sent → click link → auto-redirect to login
- **Resend:** Allow resend after 1 min if expired

### Password Reset
- **Token:** 32-char random, single-use, 1h expiry
- **Flow:** Forgot → email sent → click link → new password form → redirect to login

---

## 6. Audit Logging

### Events to Track
| Action | Details Logged |
|--------|----------------|
| `user.register` | Email, displayName, IP, User-Agent |
| `user.email_verified` | Timestamp |
| `user.login_success` | IP, User-Agent |
| `user.login_failed` | Email, failure reason, IP |
| `user.password_changed` | Admin or user-initiated |
| `user.profile_updated` | Changed fields |
| `user.deactivated` | By admin |
| `user.activated` | By admin |

### Storage
- Log all to `AuditLog` table with `userId`, `action`, `metadata` (JSON)
- Retain for 2 years (compliance)

---

## 7. Data Validation

### Registration
```
Email: RFC 5322 format, max 255 chars, must be unique
Display Name: 2-100 chars, alphanumeric + spaces/hyphens
Password: 8-128 chars, uppercase, lowercase, digit, special char
```

### Login
```
Email: RFC 5322 format
Password: Attempt → rate-limit after 5 failures (15 min block)
```

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Add `User` model to Prisma schema
- [ ] Extend `AuditLog` with user tracking
- [ ] Create `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`
- [ ] Create `/api/users/me` GET/PUT
- [ ] Database migration & seed test users
- [ ] Error handling & validation schemas

### Phase 2: User Flows (Week 2-3)
- [ ] Email verification (`/api/auth/verify-email`)
- [ ] Password reset flow (`/api/auth/forgot-password`, `/api/auth/reset-password`)
- [ ] Session persistence & refresh logic
- [ ] `/register`, `/login`, `/me` frontend pages
- [ ] Email templates (verification, reset, welcome)

### Phase 3: Admin Management (Week 3-4)
- [ ] `/api/admin/users` list + filters
- [ ] `/api/admin/users/[id]` detail + audit log view
- [ ] Deactivate/activate endpoints
- [ ] `/admin/users` and `/admin/users/[slug]` pages
- [ ] Audit log visualization

### Phase 4: Polish & Security (Week 4)
- [ ] Rate limiting on auth endpoints
- [ ] Session expiry & refresh
- [ ] 2FA optional (stretch goal)
- [ ] Email rate limiting
- [ ] Test coverage for auth flows

---

## 9. Dependencies & Libraries

| Task | Library | Notes |
|------|---------|-------|
| Password hashing | `bcrypt` | Already used for admin |
| Email validation | `zod` | Schema validation |
| Email sending | Resend/Nodemailer | (Choose based on env) |
| Token generation | `crypto` | Node.js built-in |
| Session mgmt | Next.js cookies | Leverage existing pattern |
| Rate limiting | `redis` + express-rate-limit | Optional; simple in-memory for MVP |

---

## 10. File Structure

```
src/
├── lib/
│   ├── auth/
│   │   ├── session.ts          (user session helpers, pattern from admin/session.ts)
│   │   ├── password.ts         (bcrypt hash/verify)
│   │   ├── token.ts            (email verify & reset tokens)
│   │   └── email.ts            (email sending service)
│   ├── admin/
│   │   └── user-repository.ts  (User CRUD + audit queries)
│   └── validations.ts          (add user schemas)
├── app/
│   ├── (public)/
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── verify-email/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   └── me/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts
│   │   │   ├── verify-email/route.ts
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── forgot-password/route.ts
│   │   │   ├── reset-password/route.ts
│   │   │   └── session/route.ts
│   │   └── users/
│   │       └── me/route.ts
│   ├── admin/
│   │   └── users/
│   │       ├── page.tsx
│   │       └── [slug]/
│   │           └── page.tsx
│   └── api/admin/
│       └── users/
│           ├── route.ts
│           └── [id]/
│               ├── route.ts
│               ├── deactivate/route.ts
│               └── activate/route.ts
└── components/
    ├── auth/
    │   ├── RegisterForm.tsx
    │   ├── LoginForm.tsx
    │   └── PasswordResetForm.tsx
    └── admin/
        ├── UsersList.tsx
        └── AuditLogViewer.tsx
```

---

## 11. Success Criteria

- [ ] User can register with email verification
- [ ] User can log in / log out
- [ ] User can view & edit profile at `/me`
- [ ] User can reset password
- [ ] Admin can list users with filters
- [ ] Admin can view user details + full audit trail
- [ ] Admin can deactivate/activate users
- [ ] All auth endpoints rate-limited
- [ ] No SQL injection or XSS vulnerabilities
- [ ] Email templates tested

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Email service failure | Retry queue + fallback notification UI |
| Session hijacking | HttpOnly cookies, CSRF tokens, IP validation |
| Brute force attacks | Rate limiting, account lockout |
| Plaintext passwords | Bcrypt with 10+ rounds |
| Audit log bloat | Archive old logs monthly, set retention policy |
| User privacy | Minimal data collection, GDPR delete endpoint |

---

## 13. Next Steps

1. **Review & Approve** this plan with team
2. **Create Prisma migration** for User & AuditLog updates
3. **Begin Phase 1** with `/api/auth/register` endpoint
4. **Daily standups** on blockers
5. **Weekly demo** of working features

---

**Document Owner:** Dev Team  
**Last Updated:** 2026-05-09  
**Next Review:** Upon Phase 1 completion

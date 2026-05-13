# Admin Login Recovery - Quick Reference

## 🆘 Admin Can't Login? Use This.

### Step 1: Test Login
```bash
curl -X POST http://localhost:3000/api/admin/diagnostics/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}'
```

### Step 2: Run Recovery
```bash
curl -X POST http://localhost:3000/api/admin/recovery/reactivate \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD","accessCode":"826272"}'
```

**Access Codes** (from `.env`):
- `826272` = super_admin
- `404653` = founder_admin

### Step 3: Try Login
1. Clear cookies in browser (DevTools → Application → Cookies)
2. Go to `/admin/login`
3. Enter email & password
4. ✅ Done!

---

## 📍 Recovery Endpoints

| Endpoint | Purpose | Example |
|----------|---------|---------|
| `POST /api/admin/diagnostics/login` | Check what's wrong | `curl -X POST http://localhost:3000/api/admin/diagnostics/login` |
| `POST /api/admin/recovery/reactivate` | Fix the issue | `curl -X POST http://localhost:3000/api/admin/recovery/reactivate` |
| `GET /api/admin/diagnostics/health` | System status | `curl http://localhost:3000/api/admin/diagnostics/health` |

---

## 🔧 Common Issues & Fixes

| Issue | Reason | Fix |
|-------|--------|-----|
| "PASSWORD_HASH_MISSING" | Password never stored | Run recovery endpoint |
| "ACCOUNT_INACTIVE" | Account disabled | Run recovery endpoint |
| Access code rejected | Wrong code | Check `.env` for correct code |
| Login still fails | Cookies cached | Clear cookies & hard refresh |
| Recovery returns 503 | DB not configured | Check `DATABASE_URL` env var |

---

## 📊 Diagnostic Response Meanings

```json
{
  "reason": "PASSWORD_HASH_MISSING",  // Password never stored in DB
  "isActive": false,                  // Account is disabled
  "hasPasswordHash": false,           // Bcrypt hash is NULL
  "status": "critical"                // This account is broken
}
```

If you see "status": "critical" → use recovery endpoint

---

## 🚀 In Development

```bash
pnpm dev
# Server running on http://localhost:3000

# Test recovery:
curl -X POST http://localhost:3000/api/admin/recovery/reactivate \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123","accessCode":"826272"}'

# Check system health:
curl http://localhost:3000/api/admin/diagnostics/health \
  -H "Cookie: admin_session=<your-cookie>"
```

---

## 🏢 In Production

1. Same endpoints work in production
2. Add recovery link to admin UI
3. Monitor: `SELECT COUNT(*) FROM "AdminUser" WHERE "passwordHash" IS NULL;`
4. Alert if count > 0

---

## 🔗 Full Documentation

- **Complete Guide:** `docs/ADMIN-AUTH-RECOVERY.md`
- **Security Review:** `ADMIN-AUTH-SECURITY-REVIEW.md`
- **Implementation:** `ADMIN-LOGIN-FIX-SUMMARY.md`

---

## 📞 If Still Broken

1. Check `.env` has `DATABASE_URL`
2. Verify `ADMIN_*_ACCESS_CODE` values
3. Check browser console for errors
4. Query DB: `SELECT * FROM "AdminUser" WHERE email = 'YOUR_EMAIL';`
5. Contact: Check if account exists and has passwordHash

---

**Print this page or bookmark for quick reference!**

# DownBelow Website Zero to Hero - Support Pack

Generated from source inspection on May 26, 2026.

## Executive Summary

The DownBelow website is a Next.js App Router application with a public education/intake side and a protected admin control plane. Public users can read content, register, verify email, sign in, comment on events, submit reviews, use V-Vault, and view account notifications. Admins manage settings, alerts, media, team, gallery, events, library articles, podcast episodes, reviews, users, admin accounts, and V-Vault moderation. Backend operations depend on Prisma/CockroachDB, Cloudflare R2, Resend, environment validation, rate limits, audit logs, and public database fallback behavior.

The most important operational truth: public visibility is controlled by status, role permissions, and database-backed records. Admin pages are for trusted operators only. V-Vault and account management are sensitive workflows and should be handled by super admins.

## Full Table of Contents

| Section | What it covers |
|---|---|
| Front Matter | Title Page; Copyright and Disclaimer; Dedication; Acknowledgements; Preface; Who This Book Is For; How to Use This Book |
| Part I - The Operating Model | Architecture mental model, public/admin/backend map, role model, source truth |
| Part II - Running the Public Website | Home, alerts, PWA, About, Team, Outreach, Contact, Events, Library, Podcast, Gallery, Reviews, V-Vault, public accounts |
| Part III - Running the Admin Side | Admin auth, dashboard, settings, alerts, media, boards, user management, admin accounts, V-Vault moderation, audit logs |
| Part IV - Backend and Production Operations | Next.js App Router, Prisma/CockroachDB, migrations, R2, Resend, env, rate limiting, fallback behavior, security, deployment |
| Part V - Checklists and Troubleshooting | Daily/weekly/release checklists, troubleshooting table, glossary, appendices, operator quick reference |

## Feature Coverage Checklist

| Area | Route/module | Coverage | Status |
|---|---|---|---|
| Public page | / | Home, site settings, V-Vault preview, latest articles | Covered |
| Public page | /home | Redirects to / | Covered |
| Public page | /about | Mission, vision, team preview | Covered |
| Public page | /contact | Contact request form | Covered |
| Public page | /events and /events/[slug] | Events, streams, likes, comments | Covered |
| Public page | /library and /library/[slug] | Articles, categories, detail pages | Covered |
| Public page | /outreach | Static outreach content | Covered |
| Public page | /podcast and /podcast/[slug] | Episode listing/detail/audio | Covered |
| Public page | /gallery and /gallery/[slug] | Gallery grid/modal/detail redirect | Covered |
| Public page | /team | Team directory | Covered |
| Public page | /review | Reviews, public submission, helpful marks | Covered |
| Public page | /vault | Authenticated V-Vault submission | Covered |
| Public page | /privacy and /terms | Legal information routes | Covered |
| Public auth | /register /login /forgot-password /reset-password /verify-email | Public identity lifecycle | Covered |
| Public page | /me | Profile, password change, notifications | Covered |
| SEO/PWA | robots sitemap manifest metadata structured data | Search/install support | Covered |
| Public API | /api/auth/register login logout session forgot-password reset-password verify-email resend-verification | Public authentication actions | Covered |
| Public API | /api/contact | Contact submissions and contact rate limit | Covered |
| Public API | /api/events /api/events/[slug] /comments /like | Published events, likes, comments | Covered |
| Public API | /api/gallery /api/gallery/[slug] | Gallery records and detail lookup | Covered |
| Public API | /api/reviews /api/reviews/[id]/helpful | Review submission and helpful marks | Covered |
| Public API | /api/users/me /api/users/notifications /read | Profile and notifications | Covered |
| Public API | /api/vault /api/vault/me | V-Vault submit and thread history | Covered |
| Public API | /api/alerts/active | Active site alert ticker feed | Covered |
| Admin page | /admin | Dashboard | Covered |
| Admin auth | /admin/sign-in /register /verify-email /forgot-password /reset-password | Admin identity lifecycle | Covered |
| Admin requested feature | /admin/recovery | Not active in current route inventory; current flow uses verify/reset/account activation | Documented as not active |
| Admin page | /admin/settings | Site settings | Covered |
| Admin page | /admin/alerts | Site alert ticker controls | Covered |
| Admin page | /admin/media | Media library and R2 upload | Covered |
| Admin page | /admin/team | Team management | Covered |
| Admin page | /admin/gallery | Gallery management | Covered |
| Admin page | /admin/events | Events and comment moderation | Covered |
| Admin page | /admin/library | Article management | Covered |
| Admin page | /admin/podcast | Podcast management | Covered |
| Admin page | /admin/reviews | Review moderation and replies | Covered |
| Admin page | /admin/users and /admin/users/[slug] | Public user management and audit detail | Covered |
| Admin page | /admin/admin-users | Admin account management | Covered |
| Admin page | /admin/vault | V-Vault moderation/private response | Covered |
| Admin API | /api/admin/session register verify-email forgot-password reset-password change-password | Admin authentication and account recovery | Covered |
| Admin API | /api/admin/settings alerts media team gallery events library podcast reviews users admin-users vault | Admin control plane actions and RBAC | Covered |
| Admin API | /api/admin/media/presign /complete /[id] | R2 upload and protected deletion flow | Covered |
| Admin API | /api/admin/events/[id]/comments/[commentId] | Event comment moderation | Covered |
| Backend | src/lib/env.ts prisma.ts public-database.ts storage/r2.ts email/* rate-limit.ts | Operations and infrastructure | Covered |

## Screenshot Placeholders Needed

1. Home page first viewport with alert ticker
2. Home page V-Vault preview and latest articles
3. About page mission and team preview
4. Team page founder/leadership/core sections
5. Contact page request form
6. Events listing page
7. Event detail page with stream, like button, comments, and share menu
8. Library listing with search and category filters
9. Article detail page with medical disclaimer
10. Outreach page impact section
11. Podcast listing and episode detail audio player
12. Gallery grid and image modal
13. Reviews page with submission form, helpful button, and team reply
14. V-Vault public submission form
15. Public register/login/verify/reset password screens
16. User `/me` profile and V-Vault notifications
17. PWA install prompt
18. Admin sign-in, admin registration, and verify email screens
19. Admin dashboard
20. Site Settings form
21. Site Alerts board
22. Media Library and upload modal
23. Team Members board
24. Gallery Images board
25. Events board with comment moderation panel
26. Library Articles board
27. Podcast Episodes board
28. Reviews board with admin reply
29. User detail page with audit timeline
30. Admin Accounts board
31. V-Vault moderation board and response composer

## Operator Quick Reference

| Need to do | Go here | Remember |
|---|---|---|
| Publish an event | /admin/events | Draft first, stable slug, publish after checking stream and engagement. |
| Moderate event comments | /admin/events | Use visible/hidden/flagged. |
| Publish an article | /admin/library | Founder admin or higher; include disclaimer context and stable slug. |
| Upload media | /admin/media or upload modal | Allowed type/size, label, alt text; R2 must be configured. |
| Reply to V-Vault | /admin/vault | Super admin only; response creates in-app notification. |
| Help user reset password | /forgot-password | Never ask for passwords. Use reset flow. |
| Create admin | /admin/register or /admin/admin-users | Use lowest role and verify email. |
| Change hero/footer | /admin/settings | Super admin only. |
| Post home alert | /admin/alerts | Short, scheduled, remove when done. |
| Prepare deployment | Terminal/provider dashboard | `pnpm verify:release`, `pnpm db:deploy`, env checklist, smoke test. |

## Accuracy Notes

- The current working tree does not include active `/admin/recovery` or `/api/admin/recovery/reactivate` routes. The guide documents current admin recovery through verify email, forgot/reset password, and admin account activation/deactivation.
- The Contact API saves contact submissions but does not send email in the inspected code.
- V-Vault private response creates an in-app notification; the email template exists, but the response repository does not currently send that email.
- Public review submissions are currently saved as published, so moderation after submission matters.
- Public database fallback exists for selected public reads. Admin writes fail explicitly instead of silently falling back.

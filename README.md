# Down Below Family Health Initiative

> **Demystifying Wellness, Empowering You**

A Family Health initiative  led by Dr. Edidiong Ekerueke(Dr. Didi) — a medical practitioner based in Calabar, Cross River State, Nigeria.

---

## Overview

Down Below Family Health Initiative reduces stigma around reproductive health through plain-language education, anonymous Q&A, and community outreach.

**Agency:** [Bespoke Tech](https://bespoketech.com.ng)  
**Client:** Down Below Family Health Initiative · Calabar, Nigeria  
**Production:** [https://down-below.com](https://down-below.com)

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — Hero, Pillars, V-Vault preview, Dr. Didi welcome, Latest articles |
| `/about` | Mission & Vision, Dr. Didi bio, Team profiles |
| `/library` | Health article grid with DB-backed content and public fallback |
| `/library/[slug]` | Article detail pages with DB-backed content and public fallback |
| `/events` | Event listing with DB-backed content, likes, comments, and stream metadata |
| `/events/[slug]` | Event detail pages with engagement controls |
| `/outreach` | Impact metrics & community gallery |
| `/podcast` | Podcast episode listing with audio players |
| `/podcast/[slug]` | Podcast detail pages with episode metadata |
| `/gallery` | Public gallery listing |
| `/gallery/[slug]` | Gallery detail route |
| `/team` | Public team directory |
| `/review` | Reviews, public submission, and helpful marks |
| `/vault` | Authenticated private V-Vault question form |
| `/me` | User profile, password change, notifications, and V-Vault history |
| `/contact` | Booking form + social media links |
| `/privacy` | Privacy policy |
| `/terms` | Terms of use |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript strict)
- **Styling:** Tailwind CSS v4 + CSS custom properties (brand tokens)
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React
- **Fonts:** Production-safe system font stack
- **Images:** next/image with local assets, Cloudflare R2, and approved remote hosts

---

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

```bash
pnpm build    # Production build
pnpm start    # Start production server
```

---

## Vercel Standardization (Kingsley-A1)

If you see `404: NOT_FOUND` with a Vercel request ID, this project usually has one of these account-level issues:

- Multiple similarly named Vercel projects linked to the same repo
- Deployment Protection enabled on one project while domain points to another
- Domain alias attached to the wrong project

Recommended setup:

1. Keep one production Vercel project for this repo (delete duplicates or remove their domains).
2. Ensure the project is linked to `Kingsley-A1/down-below-with-dr-didi` on `main`.
3. Ensure root directory is repository root (`.`).
4. This repo includes `vercel.json` with `framework: nextjs` for explicit framework detection.
5. Re-deploy production and re-assign the production domain to the active project.

---

## Brand Colours

| Token | Hex | Usage |
|---|---|---|
| Primary | `#0B4E41` | Backgrounds, headers, buttons |
| Accent | `#FCEE21` | CTAs, highlights, active states |
| Surface | `#FAFAFA` | Page backgrounds, cards |

---

## Environment Variables

For production, create `.env.local` or provider-managed environment variables:

```env
DATABASE_URL=...
JWT_SECRET=...
ADMIN_SESSION_SECRET=...
ADMIN_ACCESS_CODE=...
ADMIN_SUPER_ADMIN_ACCESS_CODE=...
ADMIN_FOUNDER_ADMIN_ACCESS_CODE=...
ADMIN_EDITOR_ACCESS_CODE=...
NEXT_PUBLIC_SITE_URL=https://down-below.com
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=no-reply@down-below.com
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
R2_PUBLIC_URL=...
```

---

© 2026 Down Below Family Health Initiative · Designed & Developed by [Bespoke Tech](https://bespoketech.com.ng)

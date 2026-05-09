# Down Below Family Health Initiative

> **Demystifying Wellness, Empowering You**

A Family Health initiative  led by Dr. Edidiong Ekerueke(Dr. Didi) — a medical practitioner based in Calabar, Cross River State, Nigeria.

---

## Overview

Down Below Family Health Initiative reduces stigma around reproductive health through plain-language education, anonymous Q&A, and community outreach.

**Agency:** [King Tech Foundation](https://kingtech.com.ng)  
**Client:** Down Below Family Health Initiative · Calabar, Nigeria  
**Production:** [https://down-below.com](https://down-below.com)

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — Hero, Pillars, V-Vault preview, Dr. Didi welcome, Latest articles |
| `/about` | Mission & Vision, Dr. Didi bio, Team profiles, Partners |
| `/library` | Health article grid with search & category filters |
| `/library/[slug]` | Article detail pages (6 articles, SSG) |
| `/outreach` | Impact metrics & community gallery |
| `/podcast` | Podcast episode listing with audio players and downloads |
| `/podcast/[slug]` | Podcast detail pages with show notes and transcripts |
| `/vault` | Anonymous Q&A submission form + FAQ accordion |
| `/contact` | Booking form + social media links |

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

For production, create `.env.local`:

```env
DIDI_EMAIL=drdidi@example.com    # Notification recipient for V-Vault & bookings
RESEND_API_KEY=re_...            # Resend transactional email API key
```

---

© 2026 Down Below Family Health Initiative · Designed & Developed by [King Tech Foundation](https://kingtech.com.ng)

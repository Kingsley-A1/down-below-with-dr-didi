# Down Below With Dr. Didi

> **Demystifying Wellness, Empowering You**

A professional women's sexual and reproductive health (SRH) platform led by Dr. Didi — a medical practitioner based in Calabar, Cross River State, Nigeria.

---

## Overview

Down Below With Dr. Didi reduces stigma around reproductive health through plain-language education, anonymous Q&A, and community outreach.

**Agency:** [King Tech Foundation](https://kingtech.com.ng)  
**Client:** Down Below With Dr. Didi · Calabar, Nigeria

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — Hero, Pillars, V-Vault preview, Dr. Didi welcome, Latest articles |
| `/about` | Mission & Vision, Dr. Didi bio, Team profiles, Partners |
| `/library` | Health article grid with search & category filters |
| `/library/[slug]` | Article detail pages (6 articles, SSG) |
| `/outreach` | Impact metrics & community gallery |
| `/vault` | Anonymous Q&A submission form + FAQ accordion |
| `/contact` | Booking form + social media links |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript strict)
- **Styling:** Tailwind CSS v4 + CSS custom properties (brand tokens)
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React
- **Fonts:** Cormorant Garamond · Plus Jakarta Sans · Dancing Script (Google Fonts)
- **Images:** next/image with Unsplash CDN

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

```bash
npm run build    # Production build
npm start        # Start production server
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

© 2024 Down Below With Dr. Didi · Designed & Developed by [King Tech Foundation](https://kingtech.com.ng)

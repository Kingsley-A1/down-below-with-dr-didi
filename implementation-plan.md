# Down Below With Dr. Didi — Implementation Plan

> **Agency:** King Tech Foundation · [kingtech.com.ng](https://kingtech.com.ng)  
> **Client:** Down Below With Dr. Didi · Calabar, Cross River, Nigeria  
> **Tagline:** *Demystifying Wellness, Empowering You*  
> **Document version:** 1.0 · April 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Brand Identity & Design System](#2-brand-identity--design-system)
3. [Tech Stack & Architecture](#3-tech-stack--architecture)
4. [Repository & Folder Structure](#4-repository--folder-structure)
5. [Site Architecture](#5-site-architecture)
6. [Page-by-Page Specifications](#6-page-by-page-specifications)
   - [Home (/)](#61-home-)
   - [About (/about)](#62-about-about)
   - [Health Library (/library)](#63-health-library-library)
   - [Community Outreach (/outreach)](#64-community-outreach-outreach)
   - [The V-Vault (/vault)](#65-the-v-vault-vault)
   - [Contact & Booking (/contact)](#66-contact--booking-contact)
7. [Shared Components](#7-shared-components)
8. [Data Models & Content Schema](#8-data-models--content-schema)
9. [API Routes](#9-api-routes)
10. [Image Strategy](#10-image-strategy)
11. [Animation & Interaction Design](#11-animation--interaction-design)
12. [Forms, Validation & Email](#12-forms-validation--email)
13. [SEO & Metadata Strategy](#13-seo--metadata-strategy)
14. [Performance & Accessibility](#14-performance--accessibility)
15. [Build Phases & Milestones](#15-build-phases--milestones)
16. [Deployment & Infrastructure](#16-deployment--infrastructure)
17. [Testing Strategy](#17-testing-strategy)

---

## 1. Project Overview

**Down Below With Dr. Didi** is a women's health and sexual-and-reproductive-health (SRH) platform led by Dr. Didi — a medical practitioner based in Calabar, Cross River State, Nigeria. The platform reduces stigma around reproductive health through plain-language education, anonymous Q&A, and community outreach.

### Goals

| Goal | Success Metric |
|---|---|
| Educate visitors on SRH topics | ≥ 5 min average session time on `/library` |
| Collect anonymous questions safely | V-Vault form submissions with zero PII leakage |
| Build trust via Dr. Didi's credibility | About page reads + booking conversions |
| Showcase community impact | Outreach gallery engagement |
| Drive appointment bookings | Contact form submission rate |

### Audience

- Women aged 16–45 in Nigeria (and diaspora)
- Healthcare workers seeking patient education resources
- Community health advocates

---

## 2. Brand Identity & Design System

### Logo & Brand Mark

The hero logo features:
- Dark green circular background (`#0B4E41`)
- White silhouette of a woman's head (facing right)
- A bright yellow dandelion (`#FCEE21`) growing from within the silhouette
- Text: **"DOWN BELOW"** in Cormorant Garamond bold / **"With Dr. Didi"** in Plus Jakarta Sans light

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#0B4E41` | Backgrounds, buttons, headers |
| `--color-accent` | `#FCEE21` | CTAs, highlights, active states |
| `--color-surface` | `#FAFAFA` | Page backgrounds, cards |
| `--color-text` | `#2D3436` | Body text |
| `--color-primary-light` | `#1A6B5A` | Hover states on primary |
| `--color-primary-muted` | `#E8F5F1` | Subtle section backgrounds |
| `--color-accent-dark` | `#D4C400` | Hover states on accent |
| `--color-border` | `#E0E0E0` | Card borders, dividers |
| `--color-error` | `#E53E3E` | Form validation errors |
| `--color-success` | `#38A169` | Success messages |

### Typography

```css
/* Headings — Cormorant Garamond (Google Fonts) */
font-family: 'Cormorant Garamond', Georgia, serif;
/* Weights: 400 (regular), 600 (semi-bold), 700 (bold) */

/* Body & UI — Plus Jakarta Sans (Google Fonts) */
font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
/* Weights: 300 (light), 400 (regular), 500 (medium), 600 (semi-bold), 700 (bold) */
```

### Type Scale

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `text-display` | 4rem / 64px | 1.1 | 700 | Hero headlines |
| `text-h1` | 3rem / 48px | 1.15 | 700 | Page titles |
| `text-h2` | 2.25rem / 36px | 1.2 | 600 | Section headings |
| `text-h3` | 1.75rem / 28px | 1.3 | 600 | Sub-sections |
| `text-h4` | 1.25rem / 20px | 1.4 | 600 | Card titles |
| `text-body-lg` | 1.125rem / 18px | 1.7 | 400 | Lead paragraphs |
| `text-body` | 1rem / 16px | 1.75 | 400 | Body text |
| `text-sm` | 0.875rem / 14px | 1.6 | 400 | Captions, labels |
| `text-xs` | 0.75rem / 12px | 1.5 | 400 | Fine print |

### Spacing & Layout

- Base unit: `4px`
- Container max-width: `1280px`
- Content max-width: `768px`
- Section padding: `py-20` (80px) desktop, `py-12` (48px) mobile
- Grid: 12-column, gutters `gap-6` (24px)

### Iconography

- Library: [Lucide React](https://lucide.dev) — clean, minimal, accessible
- Custom health icons: SVG inline components for pillar cards

### Shadows & Radius

```css
--shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
--shadow-md: 0 4px 16px rgba(11,78,65,0.12);
--shadow-lg: 0 8px 32px rgba(11,78,65,0.16);
--radius-sm: 8px;
--radius-md: 16px;
--radius-lg: 24px;
--radius-full: 9999px;
```

---

## 3. Tech Stack & Architecture

### Core Dependencies

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Framework | Next.js (App Router) | 15.x | SSR + SSG, file-based routing, RSC |
| Language | TypeScript | 5.x (strict) | Type safety, better DX |
| Styling | Tailwind CSS | v4 | Utility-first, design tokens |
| Forms | React Hook Form | 7.x | Performance, uncontrolled inputs |
| Validation | Zod | 3.x | Runtime schema validation |
| Email | Resend | 4.x | Transactional email API |
| Animation | Framer Motion | 12.x | Page transitions, reveal animations |
| Icons | Lucide React | latest | Accessible SVG icons |
| Date picking | React Day Picker | 8.x | Booking calendar |
| Markdown | next-mdx-remote | 5.x | Library article rendering |
| Fonts | next/font | built-in | Zero-CLS font loading |

### Dev Dependencies

| Tool | Purpose |
|---|---|
| ESLint + eslint-config-next | Linting |
| Prettier | Code formatting |
| Husky + lint-staged | Pre-commit hooks |
| Jest + Testing Library | Unit + integration tests |
| Playwright | E2E tests |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel CDN                           │
├─────────────────────────────────────────────────────────────┤
│                     Next.js App Router                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Static Pages │  │    SSR Pages │  │   API Routes     │  │
│  │  Home, About │  │  Library,    │  │  /api/vault      │  │
│  │  Outreach    │  │  Vault       │  │  /api/contact    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Data / Content Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  MDX files   │  │  JSON data   │  │  Resend (email)  │  │
│  │  (articles)  │  │  (prototype) │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Rendering Strategy per Page

| Page | Strategy | Reason |
|---|---|---|
| `/` | SSG (static) | No dynamic data, max performance |
| `/about` | SSG | Static content |
| `/library` | SSG + ISR (1h) | Article list, revalidate periodically |
| `/library/[slug]` | SSG + ISR | Individual articles |
| `/outreach` | SSG | Static gallery |
| `/vault` | SSG (form is client-side) | Privacy: no server state |
| `/contact` | SSG (form is client-side) | Static shell + API call |

---

## 4. Repository & Folder Structure

```
down-below-with-dr-didi/
├── public/
│   ├── favicon.ico
│   ├── logo.svg                      # Brand mark SVG
│   ├── og-image.jpg                  # Open Graph default (1200×630)
│   └── fonts/                        # Self-hosted fallback fonts (optional)
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (Navbar + Footer)
│   │   ├── page.tsx                  # Home /
│   │   ├── about/
│   │   │   └── page.tsx
│   │   ├── library/
│   │   │   ├── page.tsx              # Library index
│   │   │   └── [slug]/
│   │   │       └── page.tsx          # Article detail
│   │   ├── outreach/
│   │   │   └── page.tsx
│   │   ├── vault/
│   │   │   └── page.tsx
│   │   ├── contact/
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   ├── vault/
│   │   │   │   └── route.ts          # POST: anonymous question submission
│   │   │   └── contact/
│   │   │       └── route.ts          # POST: contact/booking form
│   │   ├── globals.css               # Tailwind base + custom properties
│   │   ├── not-found.tsx
│   │   └── error.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MobileMenu.tsx
│   │   ├── ui/                       # Reusable primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Accordion.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Spinner.tsx
│   │   ├── home/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── PillarsSection.tsx
│   │   │   ├── VaultPreviewCarousel.tsx
│   │   │   ├── WelcomeMessage.tsx
│   │   │   └── LatestResources.tsx
│   │   ├── library/
│   │   │   ├── ArticleCard.tsx
│   │   │   ├── CategoryFilter.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── MedicalDisclaimer.tsx
│   │   ├── outreach/
│   │   │   ├── GalleryGrid.tsx
│   │   │   ├── ImpactMetrics.tsx
│   │   │   └── GalleryModal.tsx
│   │   ├── vault/
│   │   │   ├── SubmissionForm.tsx
│   │   │   └── FaqAccordion.tsx
│   │   └── contact/
│   │       ├── BookingCalendar.tsx
│   │       └── EnquiryForm.tsx
│   │
│   ├── content/
│   │   ├── articles/                 # MDX article files
│   │   │   ├── understanding-your-cycle.mdx
│   │   │   ├── menstrual-hygiene-guide.mdx
│   │   │   ├── sti-prevention-basics.mdx
│   │   │   ├── pap-smear-what-to-expect.mdx
│   │   │   ├── female-anatomy-overview.mdx
│   │   │   └── contraception-options.mdx
│   │   └── faq.json                  # V-Vault FAQ data
│   │
│   ├── data/
│   │   ├── team.ts                   # Dr. Didi + team member data
│   │   ├── outreach.ts               # Gallery items + impact metrics
│   │   ├── vault-preview.ts          # Sample anonymous Q&A for carousel
│   │   └── partners.ts               # Partner logos + names
│   │
│   ├── lib/
│   │   ├── mdx.ts                    # MDX parsing utilities
│   │   ├── email.ts                  # Resend client wrapper
│   │   ├── validations.ts            # Zod schemas (vault, contact)
│   │   └── utils.ts                  # cn(), formatDate(), slugify()
│   │
│   └── types/
│       ├── article.ts
│       ├── team.ts
│       └── outreach.ts
│
├── content/                          # (alias of src/content — optional)
├── .env.local.example                # Environment variable template
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
└── package.json
```

---

## 5. Site Architecture

```
/ (Home)
├── Hero — Logo animation + 2 CTAs
├── Pillars — Education · Community · Care
├── V-Vault Preview — Carousel of anonymous Q&A snippets
├── Welcome Message — Dr. Didi intro video/photo
└── Latest Resources — 3 most recent library articles

/about
├── Mission & Vision
├── Dr. Didi bio + photo
├── Team profiles (2–3 cards)
└── Partners & Collaborations

/library
├── Search bar
├── Category filters (Menstrual · Sexual Wellness · Preventative · Anatomy)
├── Article card grid
└── Medical disclaimer (sticky footer ribbon)

/library/[slug]
├── Article header (category, title, read time)
├── MDX content with rich formatting
├── Related articles
└── Medical disclaimer

/outreach
├── Impact metrics (animated counters)
├── Masonry gallery grid
└── Gallery lightbox modal

/vault
├── Privacy assurance banner
├── Anonymous submission form
└── FAQ accordions

/contact
├── Booking calendar
├── Enquiry form
└── Social media links
```

### Navigation Structure

**Primary Nav (Desktop — sticky):**
```
[Logo]          Home | Library | About | V-Vault | Outreach | [Book Now ↗]
```

**Mobile Nav:**
Hamburger → slide-over drawer with same links + social icons at bottom.

---

## 6. Page-by-Page Specifications

### 6.1 Home (`/`)

#### 6.1.1 Hero Section

**Layout:** Full-viewport (`min-h-screen`), split 55/45 on desktop, stacked on mobile.

**Left Panel:**
- Animated SVG logo (dandelion petals bloom on load using Framer Motion `draw` variants, 1.2s)
- H1: "Demystifying Wellness, **Empowering You**" (accent word in `#FCEE21`)
- Sub-tagline: "Down Below With Dr. Didi — your trusted space for honest conversations about reproductive and sexual health."
- CTA 1: **"Explore the Library"** → `/library` (primary button, filled, `#FCEE21` bg, `#0B4E41` text)
- CTA 2: **"Ask Anonymously"** → `/vault` (secondary button, outlined, white border on primary bg)

**Right Panel:**
- Real hero image: Doctor in clinical setting with warm lighting  
  → Source: `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=900` *(female doctor, professional portrait)*
- Floating badge: "🌿 Safe Space · Judgment Free"
- Soft radial gradient overlay blending with `#0B4E41`

**Background:** `#0B4E41` with subtle svg noise texture overlay at 4% opacity.

#### 6.1.2 Core Pillars Section

Three cards on a `#FAFAFA` background, each with an animated SVG icon:

| Pillar | Icon | Description |
|---|---|---|
| Education | Open book with leaf | Evidence-based articles on SRH, menstrual health, anatomy |
| Community | Connected hearts | Peer stories, outreach events, safe discussion |
| Care | Stethoscope heart | Direct access to Dr. Didi — booking & consultations |

Card anatomy: Icon (48px, `#0B4E41`), H3 title, 2-line description, link arrow.  
Hover: subtle lift (`translateY(-4px)`), shadow elevation.

#### 6.1.3 V-Vault Preview Carousel

- Section bg: `#0B4E41`
- Heading: "Real Questions. Real Answers." (white, Cormorant Garamond)
- Subtitle: "Submitted anonymously. Answered with care."
- Auto-scrolling carousel (pause on hover) showing 3 Q&A cards
- Card: white bg, question in italic Plus Jakarta Sans, answer snippet, "Read more →"
- CTA: "Ask Your Own Question" → `/vault`

**Sample prototype questions:**
```
Q: "Why do I get cramps even when I'm not on my period?"
Q: "Is it normal to have irregular periods in my 20s?"
Q: "What does a healthy discharge look like?"
```

#### 6.1.4 Welcome Message from Dr. Didi

- Split layout: photo left, text right (reversed on mobile)
- Photo: Professional headshot — warm, approachable, clinical  
  → Source: `https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=600` *(female doctor with warm smile)*
- Quote block (large Cormorant Garamond italic, `#0B4E41`):  
  *"Your body deserves honesty. I created this space so you never have to feel embarrassed asking questions about your own health."*
- Signature: "— Dr. Didi, MBBS" (handwriting-style font: `Dancing Script`)
- CTA: "Meet Dr. Didi" → `/about`

#### 6.1.5 Latest Resources Preview

- Section bg: `#FAFAFA`
- Heading: "From the Health Library"
- 3-column card grid (1 col mobile, 3 col desktop)
- Each card: Category badge, article title, 1-line excerpt, read time, "Read →"
- CTA: "View All Resources" → `/library`

---

### 6.2 About (`/about`)

#### 6.2.1 Mission & Vision Banner

- Full-width, `#0B4E41` bg, centered text
- **Mission:** "To make sexual and reproductive health knowledge accessible, understandable, and stigma-free for every woman."
- **Vision:** "A Nigeria where every woman knows her body, understands her rights, and has access to honest health information."
- Decorative dandelion SVG (right-aligned, white, 40% opacity)

#### 6.2.2 Dr. Didi Bio

**Layout:** Image left (40%), content right (60%)

**Image:** Professional doctor portrait  
→ `https://images.unsplash.com/photo-1591604021695-0c69b7c05981?w=700` *(female doctor in white coat)*

**Content:**
- Name: **Dr. Didi** (full name placeholder: *Dr. Adaeze Okonkwo*)
- Credentials: MBBS, MPH · University of Calabar
- Role: Founder, Down Below With Dr. Didi
- Bio (3 paragraphs): Background in obstetrics/gynaecology, motivation for founding the initiative, community impact
- Credentials list (icon + text):
  - 🎓 MBBS – University of Calabar Teaching Hospital
  - 🎓 MPH – Public Health specialization, SRH
  - 📋 Licensed by Medical and Dental Council of Nigeria
  - 🏆 Cross River Health Advocate Award, 2023

#### 6.2.3 Team Profiles

**Grid:** 3 cards (or 2 + Dr. Didi featured above)

Each card:
- Avatar photo (circular, 96px)
- Name, Role, 2-sentence bio

**Prototype team data:**
```typescript
const team = [
  {
    name: "Dr. Didi",
    role: "Founder & Lead Physician",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300",
    bio: "MBBS, MPH. SRH advocate and community health educator based in Calabar."
  },
  {
    name: "Ngozi Eze",
    role: "Community Health Officer",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300",
    bio: "Leads outreach programs in underserved communities across Cross River State."
  },
  {
    name: "Amaka Obi",
    role: "Health Communications Lead",
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300",
    bio: "Social media strategy and health literacy content for young women."
  }
]
```

#### 6.2.4 Partnerships & Collaborations

Logo grid (grayscale → color on hover) of 4–6 partner organizations:

| Partner | Type |
|---|---|
| UNFPA Nigeria | International health body |
| Cross River State Ministry of Health | Government |
| Society of Gynaecology and Obstetrics of Nigeria (SOGON) | Medical association |
| Girl Effect Nigeria | NGO |
| Pathfinder International | Health NGO |

Use real partner logos from their public websites where available; otherwise use placeholder pill-shaped badges.

---

### 6.3 Health Library (`/library`)

#### 6.3.1 Page Header

- `#0B4E41` bg hero strip, H1 "Health Library", subtitle "Honest, evidence-based information about your body."
- Search bar (white bg, magnifier icon, placeholder "Search topics, conditions, questions…")

#### 6.3.2 Category Filters

Horizontal pill-button row:

| Filter | Slug |
|---|---|
| All | all |
| Menstrual Hygiene | menstrual |
| Sexual Wellness | sexual-wellness |
| Preventative Care | preventative |
| General Anatomy | anatomy |

Active state: `#FCEE21` bg, `#0B4E41` text.

#### 6.3.3 Article Card Grid

3-col desktop / 2-col tablet / 1-col mobile  
Cards sorted by `publishedAt` descending.

**Article Card anatomy:**
```
┌────────────────────────────────────┐
│  [Cover Image 400×220]             │
│                                    │
│  [Category Badge]    [Read time]   │
│  Article Title (H3)                │
│  Excerpt (2 lines, truncated)      │
│  ─────────────────────────────     │
│  [Author Avatar] Dr. Didi  →       │
└────────────────────────────────────┘
```

**Hover:** card lifts, image zooms gently (scale 1.03).

#### 6.3.4 Article Cover Images (Prototype)

| Article | Unsplash URL |
|---|---|
| Understanding Your Cycle | `https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800` |
| Menstrual Hygiene Guide | `https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800` |
| STI Prevention Basics | `https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=800` |
| Pap Smear: What to Expect | `https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800` |
| Female Anatomy Overview | `https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800` |
| Contraception Options | `https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800` |

#### 6.3.5 Article Detail Page (`/library/[slug]`)

```
┌──────────────────────────────────────────────────────────┐
│  Breadcrumb: Home › Library › Article Title             │
│  [Category Badge]  [Read time]  [Published date]         │
│  H1: Article Title                                        │
│  By Dr. Didi · [Date]                                    │
├──────────────────────────────────────────────────────────┤
│  [Hero image — full width, max 960px, rounded corners]   │
├──────────────────────────────────────────────────────────┤
│  Article body (MDX)                                       │
│  Max width: 680px, centered                              │
│  ─────────────────────────────────────────               │
│  ⚕️ Medical Disclaimer ribbon (sticky bottom)            │
├──────────────────────────────────────────────────────────┤
│  Related Articles (3 cards, same category)               │
└──────────────────────────────────────────────────────────┘
```

**MDX Custom Components:**
- `<Callout type="warning|info|tip">` — coloured info boxes
- `<KeyFact>` — pull-quote style highlight
- `<MedicalNote>` — clinical disclaimer inline

#### 6.3.6 Medical Disclaimer

Persistent ribbon at bottom of all library pages:

> ⚕️ **This content is for educational purposes only and does not constitute medical advice.** Always consult a qualified healthcare professional for diagnosis and treatment. If you are experiencing a medical emergency, contact your nearest hospital.

---

### 6.4 Community Outreach (`/outreach`)

#### 6.4.1 Impact Metrics

4-column stats bar (dark green bg):

| Metric | Value | Icon |
|---|---|---|
| Women Reached | 5,000+ | 👩 |
| Communities Served | 12 | 🏘️ |
| Health Talks Hosted | 48 | 🎤 |
| Free Screenings | 800+ | 🩺 |

Numbers animate up on scroll (Framer Motion `useInView` + counter animation).

#### 6.4.2 Community Gallery Grid

**Layout:** Masonry CSS grid, 3 columns desktop.

**Caption overlay:** On hover, dark overlay slides up with event title + location.

**Real prototype images (Unsplash — African women's health/community):**

```typescript
const galleryItems = [
  {
    id: 1,
    title: "Women's Health Workshop — Calabar South",
    date: "March 2024",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600",
    description: "Interactive workshop on menstrual health for 200+ women"
  },
  {
    id: 2,
    title: "Free Cervical Screening Drive",
    date: "January 2024",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600",
    description: "Partnered with CRSMOH for free pap smear screenings"
  },
  {
    id: 3,
    title: "School Outreach — Unical Secondary",
    date: "November 2023",
    image: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=600",
    description: "Puberty & hygiene education for 350 female students"
  },
  {
    id: 4,
    title: "Radio Health Talk — Sunrise FM",
    date: "October 2023",
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600",
    description: "Live call-in health show reaching 50,000+ listeners"
  },
  {
    id: 5,
    title: "Community Market Outreach",
    date: "August 2023",
    image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600",
    description: "Free hygiene kits distribution and health talks at markets"
  },
  {
    id: 6,
    title: "Midwives Continuing Education",
    date: "June 2023",
    image: "https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=600",
    description: "SRH update training for 60 community midwives"
  }
]
```

#### 6.4.3 Gallery Lightbox Modal

Clicking any image opens a modal with:
- Full-resolution image
- Event title, date, location
- Short description
- Prev/Next navigation (keyboard + button)
- Close on overlay click or `Escape` key

---

### 6.5 The V-Vault (`/vault`)

#### 6.5.1 Privacy Assurance Banner

Prominent banner at top:

```
🔒 Your identity is completely protected.
We do not collect your name, email, IP address, or any identifying information.
Questions are reviewed by Dr. Didi and may be published anonymously to help others.
```

Design: `#0B4E41` bg, white text, shield icon, rounded corners.

#### 6.5.2 Anonymous Submission Form

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Ask Dr. Didi Anything                              │
│  No name. No email. 100% anonymous.                 │
│                                                     │
│  Category:  [dropdown ▼]                            │
│  ┌───────────────────────────────────────────────┐  │
│  │ Menstrual Health                              │  │
│  │ Sexual Wellness                               │  │
│  │ Anatomy & Body                                │  │
│  │ Contraception                                 │  │
│  │ Pregnancy & Fertility                         │  │
│  │ Other                                         │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  Your Question:                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  [Textarea — min 50 chars, max 500 chars]     │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│  Character count: 0/500                             │
│                                                     │
│  [🔒 Submit Anonymously]                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Submission flow:**
1. Form validation (Zod: category required, question 50–500 chars)
2. POST to `/api/vault` → sends email via Resend to Dr. Didi's inbox (formatted, no sender info)
3. Success state: animated check, message "Your question has been received. Dr. Didi will review it. 💚"
4. Error state: "Something went wrong. Please try again."

**Privacy guarantee — implementation:**
- No auth required
- API route strips all headers before forwarding
- No analytics events on this page
- `robots.txt` — allow indexing of page shell, not submissions
- CSRF protection via rate limiting (5 submissions per IP per hour via Vercel Edge middleware)

#### 6.5.3 FAQ Accordions

Section: "Common Questions"

Prototype FAQ data (from `content/faq.json`):

```json
[
  {
    "id": 1,
    "category": "Menstrual Health",
    "question": "What is a normal menstrual cycle length?",
    "answer": "A typical cycle is 21–35 days, with bleeding lasting 2–7 days. Significant variation outside this range warrants a check-up with your doctor."
  },
  {
    "id": 2,
    "category": "Sexual Wellness",
    "question": "Is vaginal discharge normal?",
    "answer": "Yes — clear or white discharge is normal and helps keep the vagina clean. Changes in colour, smell, or consistency can indicate infection and should be evaluated."
  },
  {
    "id": 3,
    "category": "Contraception",
    "question": "How effective is the contraceptive pill?",
    "answer": "When taken correctly, the pill is 99% effective. With typical use it's about 91%. No contraceptive is 100% effective against STIs — condoms provide the best STI protection."
  },
  {
    "id": 4,
    "category": "Anatomy & Body",
    "question": "Why do I sometimes feel pain during sex?",
    "answer": "Pain during sex (dyspareunia) has many causes: insufficient lubrication, infection, endometriosis, or pelvic floor issues. Please consult a gynaecologist if this persists."
  },
  {
    "id": 5,
    "category": "Pregnancy & Fertility",
    "question": "How can I improve my chances of getting pregnant?",
    "answer": "Track your ovulation window (days 11–21 of your cycle), maintain a healthy BMI, avoid smoking and excessive alcohol, and consult your doctor if you've been trying for over 12 months."
  }
]
```

---

### 6.6 Contact & Booking (`/contact`)

#### 6.6.1 Booking Calendar

- Component: React Day Picker with custom Tailwind styling
- Disables Sundays and past dates
- Available slots: Mon–Sat, 9am–5pm WAT (hardcoded prototype)
- On date select → shows available 30-min time slots
- On slot select → pre-fills enquiry form with date/time

**Calendar styling:**
- Selected day: `#0B4E41` bg, white text
- Today: `#FCEE21` ring
- Hover: `#E8F5F1` bg

#### 6.6.2 Enquiry Form

```
┌─────────────────────────────────────────────────────┐
│  Book a Consultation with Dr. Didi                  │
│                                                     │
│  First Name  [_____________]                        │
│  Last Name   [_____________]                        │
│  Email       [_____________]                        │
│  Phone       [_____________]   (+234 prefix)        │
│  Preferred Date  [Calendar widget]                  │
│  Preferred Time  [Time slot selector]               │
│  Reason for visit / Message                         │
│  [___________________________________]              │
│  [___________________________________]              │
│                                                     │
│  [Send Booking Request]                             │
└─────────────────────────────────────────────────────┘
```

**Zod validation schema:**
```typescript
const contactSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().regex(/^\+?234[0-9]{10}$/).optional(),
  preferredDate: z.string().datetime().optional(),
  preferredTime: z.string().optional(),
  message: z.string().min(10).max(1000),
})
```

**Submit flow:** POST `/api/contact` → Resend sends:
1. Confirmation email to patient
2. Notification email to Dr. Didi's address (env var)

#### 6.6.3 Social Media Links

Row of social icons (Lucide + custom SVG for platforms):

| Platform | Handle | Icon |
|---|---|---|
| Instagram | @downbelowwithdrdidi | Instagram icon |
| Twitter/X | @DrDidiHealth | X icon |
| Facebook | Down Below With Dr. Didi | Facebook icon |
| WhatsApp | +234 XXX XXX XXXX | WhatsApp icon |
| YouTube | Down Below With Dr. Didi | YouTube icon |

---

## 7. Shared Components

### 7.1 Navbar

```
Breakpoint | Layout
-----------|-------
≥1024px    | Logo left · Nav links centre · "Book Now" CTA right
<1024px    | Logo left · Hamburger right → slide-over drawer
```

**Behaviour:**
- Transparent on hero sections, white/primary bg on scroll (`useScrollY` Framer Motion)
- Active link: accent underline (`#FCEE21`, 2px, animated slide-in)
- `"Book Now"` button: always visible, filled accent style

**Accessibility:**
- `role="navigation"`, `aria-label="Main navigation"`
- Focus trap in mobile drawer
- Skip-to-content link (`sr-only`, visible on focus)

### 7.2 Footer

Three-column layout:

| Column 1 | Column 2 | Column 3 |
|---|---|---|
| Logo + tagline + social icons | Quick Links (all 6 pages) | Contact info + Booking CTA |

Bottom bar: "© 2024 Down Below With Dr. Didi. Designed & Developed by **King Tech Foundation**" with link to `kingtech.com.ng`.

**Medical disclaimer line in footer:**
> "Content on this site is for educational purposes only and does not substitute professional medical advice."

### 7.3 Button Component

```typescript
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent'
type ButtonSize = 'sm' | 'md' | 'lg'

// primary: #FCEE21 bg, #0B4E41 text
// secondary: #0B4E41 bg, white text
// outline: transparent bg, #0B4E41 border
// accent: same as primary, larger padding
```

### 7.4 Card Component

Composable card with sub-components:
```typescript
<Card>
  <Card.Image />
  <Card.Body>
    <Card.Badge />
    <Card.Title />
    <Card.Text />
    <Card.Footer />
  </Card.Body>
</Card>
```

---

## 8. Data Models & Content Schema

### 8.1 Article (MDX Frontmatter)

```typescript
interface Article {
  slug: string
  title: string
  excerpt: string
  category: 'menstrual' | 'sexual-wellness' | 'preventative' | 'anatomy'
  coverImage: string           // Unsplash URL or /images/...
  author: string               // "Dr. Didi"
  publishedAt: string          // ISO date
  readTime: number             // minutes
  tags: string[]
  medicalReviewer?: string
}
```

### 8.2 Gallery Item

```typescript
interface GalleryItem {
  id: number
  title: string
  date: string
  location: string
  image: string
  description: string
  tags?: string[]
}
```

### 8.3 Team Member

```typescript
interface TeamMember {
  id: number
  name: string
  role: string
  credentials: string
  bio: string
  image: string
  socialLinks?: {
    linkedin?: string
    twitter?: string
  }
}
```

### 8.4 FAQ Item

```typescript
interface FaqItem {
  id: number
  category: string
  question: string
  answer: string
}
```

### 8.5 Vault Submission (API payload)

```typescript
interface VaultSubmission {
  category: string
  question: string
  // NO identifiable fields — enforced by Zod
}
```

### 8.6 Contact Form (API payload)

```typescript
interface ContactSubmission {
  firstName: string
  lastName: string
  email: string
  phone?: string
  preferredDate?: string
  preferredTime?: string
  message: string
}
```

---

## 9. API Routes

### 9.1 POST `/api/vault`

**Purpose:** Receive anonymous question, forward to Dr. Didi via Resend

**Request body:**
```json
{ "category": "Menstrual Health", "question": "Is it normal to..." }
```

**Processing:**
1. Validate with Zod `vaultSchema`
2. Sanitize input (strip HTML)
3. Send email via Resend:
   - **To:** `DIDI_EMAIL` (env var)
   - **Subject:** `[V-Vault] New Anonymous Question — ${category}`
   - **Body:** Plain text question with category, no sender info
4. Return `{ success: true }` or `{ error: "..." }`

**Rate limiting:** Vercel Edge Middleware — 5 req / IP / hour

**Response:**
```typescript
// 200
{ "success": true, "message": "Question received" }
// 400
{ "error": "Validation failed", "issues": [...] }
// 429
{ "error": "Too many requests. Please try again later." }
// 500
{ "error": "Failed to send. Please try again." }
```

### 9.2 POST `/api/contact`

**Purpose:** Booking request → dual email (patient confirmation + Dr. Didi notification)

**Processing:**
1. Validate with Zod `contactSchema`
2. Send confirmation to patient (`email` field) via Resend
3. Send notification to `DIDI_EMAIL`
4. Return success

**Email templates (HTML):**

*Patient confirmation:*
```
Subject: Booking Request Received — Down Below With Dr. Didi
Hi [First Name], your booking request for [Date/Time] has been received.
Dr. Didi will confirm your appointment within 24 hours...
```

*Dr. Didi notification:*
```
Subject: New Booking Request — [First Name Last Name]
Date requested: [...]
Contact: [email, phone]
Message: [...]
```

---

## 10. Image Strategy

### 10.1 Approach

All prototype images use [Unsplash](https://unsplash.com) URLs with size parameters for performance. Production images will be uploaded by the client.

### 10.2 next/image Configuration

```typescript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/photo-*',
      },
    ],
  },
}
```

### 10.3 Master Image Reference

| Location | Description | Unsplash URL |
|---|---|---|
| Hero background | Female doctor in clinic | `photo-1559839734-2b71ea197ec2` |
| Dr. Didi welcome (Home) | Female doctor warm portrait | `photo-1594824476967-48c8b964273f` |
| About — Dr. Didi bio | Doctor in white coat | `photo-1591604021695-0c69b7c05981` |
| Team — Ngozi | Young African woman professional | `photo-1531746020798-e6953c6e8e04` |
| Team — Amaka | Smiling African woman | `photo-1529626455594-4ff0802cfb7e` |
| Article: Your Cycle | Medical calendar/cycle | `photo-1579684385127-1ef15d508118` |
| Article: Menstrual Hygiene | Health/wellness flat lay | `photo-1576091160399-112ba8d25d1d` |
| Article: STI Prevention | Medical safety concept | `photo-1631815588090-d4bfec5b1ccb` |
| Article: Pap Smear | Medical examination | `photo-1584820927498-cfe5211fd8bf` |
| Article: Anatomy | Medical illustration-style | `photo-1559757175-0eb30cd8c063` |
| Article: Contraception | Health products flat lay | `photo-1585435557343-3b092031a831` |
| Outreach 1 | African women workshop | `photo-1573496359142-b8d87734a5a2` |
| Outreach 2 | Healthcare screening | `photo-1576091160550-2173dba999ef` |
| Outreach 3 | School outreach / students | `photo-1607990281513-2c110a25bd8c` |
| Outreach 4 | Radio/media broadcast | `photo-1478737270239-2f02b77fc618` |
| Outreach 5 | Community market | `photo-1532629345422-7515f3d16bb6` |
| Outreach 6 | Medical training | `photo-1581056771107-24ca5f033842` |
| OG Image | Brand image 1200×630 | Custom (generate or use hero) |

### 10.4 Image Sizing Guidelines

| Context | Width | Height | `sizes` attribute |
|---|---|---|---|
| Hero (full viewport) | 900px | 600px | `100vw` |
| Article cover | 800px | 440px | `(max-width:768px) 100vw, 66vw` |
| Gallery item | 600px | 400px | `(max-width:640px) 100vw, 33vw` |
| Team avatar | 300px | 300px | `96px` |
| Doctor bio | 700px | 500px | `(max-width:768px) 100vw, 40vw` |

All images use `loading="lazy"` except above-the-fold hero images (`priority={true}`).

---

## 11. Animation & Interaction Design

### 11.1 Page Transitions

Root layout wraps `<main>` in a Framer Motion `AnimatePresence` with a subtle fade + slide-up:

```typescript
const pageVariants = {
  initial: { opacity: 0, y: 16 },
  enter:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
}
```

### 11.2 Scroll-triggered Reveals

Using Framer Motion `useInView` hook with `once: true`:
- Section headings: fade + slide-up (20px), 0.4s
- Cards: stagger 0.1s delay per card
- Stats counter: count from 0 when in view

### 11.3 Logo Animation

SVG dandelion on hero:
1. Stem draws from bottom (0.3s, `pathLength` 0→1)
2. Each petal draws outward (staggered, 0.08s each, 8 petals)
3. Dandelion floats slightly (infinite, `y: [0, -6, 0]`, 4s ease-in-out loop)

### 11.4 Hover States

| Element | Hover Effect |
|---|---|
| Navigation links | Accent underline slides in from left (0.2s) |
| Buttons | Scale 1.02, shadow elevation |
| Cards | translateY -4px, shadow deepens |
| Gallery images | Scale 1.05, overlay fades in |
| Partner logos | Grayscale 1→0 (color reveal, 0.3s) |
| Social icons | Color fill, scale 1.1 |

### 11.5 Micro-interactions

- Form inputs: border color transitions to `#0B4E41` on focus
- Accordion: smooth height animation via `AnimatePresence`
- Calendar day hover: gentle scale + bg fill
- Success checkmark: SVG draw animation on form submit

---

## 12. Forms, Validation & Email

### 12.1 Vault Form Schema

```typescript
// src/lib/validations.ts
export const vaultSchema = z.object({
  category: z.enum([
    'Menstrual Health',
    'Sexual Wellness',
    'Anatomy & Body',
    'Contraception',
    'Pregnancy & Fertility',
    'Other',
  ]),
  question: z
    .string()
    .min(50, 'Please provide at least 50 characters so Dr. Didi can help you best.')
    .max(500, 'Maximum 500 characters.'),
})
```

### 12.2 Contact Form Schema

```typescript
export const contactSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(/^(\+234|0)[789][01]\d{8}$/, 'Please enter a valid Nigerian phone number')
    .optional()
    .or(z.literal('')),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  message: z.string().min(10, 'Please provide a message (min 10 characters)').max(1000),
})
```

### 12.3 Email Templates

Both templates use Resend's React email template format (`@react-email/components`):

**Vault email** (to Dr. Didi only):
- Minimal HTML, no patient info in headers
- Subject: `[V-Vault] ${category} — Anonymous Question`
- Body: category + question text + timestamp
- Footer: "Sent anonymously via Down Below With Dr. Didi"

**Contact confirmation** (to patient):
- Branded template: `#0B4E41` header with logo
- Booking summary
- "What happens next" steps
- Dr. Didi signature

---

## 13. SEO & Metadata Strategy

### 13.1 Root Metadata (`layout.tsx`)

```typescript
export const metadata: Metadata = {
  title: { template: '%s | Down Below With Dr. Didi', default: 'Down Below With Dr. Didi' },
  description: 'Honest, stigma-free reproductive and sexual health education by Dr. Didi — Calabar, Nigeria.',
  keywords: ['sexual health Nigeria', 'reproductive health', 'SRH', 'Dr Didi', 'women health Calabar'],
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://downbelowwithdrdidi.com',
    siteName: 'Down Below With Dr. Didi',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}
```

### 13.2 Per-page Metadata

| Page | Title | Description |
|---|---|---|
| Home | Down Below With Dr. Didi | Stigma-free SRH education |
| About | About Dr. Didi | Meet the founder |
| Library | Health Library | Browse SRH articles |
| `/library/[slug]` | `${article.title}` | `${article.excerpt}` |
| Outreach | Community Impact | Our outreach work |
| Vault | The V-Vault — Ask Anonymously | 100% anonymous questions |
| Contact | Book a Consultation | Schedule with Dr. Didi |

### 13.3 Structured Data

Article pages include JSON-LD `MedicalWebPage` schema:

```json
{
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  "name": "Article Title",
  "description": "Excerpt",
  "author": { "@type": "Person", "name": "Dr. Didi" },
  "medicalAudience": "Patient",
  "datePublished": "ISO date"
}
```

Homepage includes `Organization` schema.

---

## 14. Performance & Accessibility

### 14.1 Performance Targets

| Metric | Target |
|---|---|
| Lighthouse Performance | ≥ 90 |
| Lighthouse Accessibility | ≥ 95 |
| Lighthouse SEO | ≥ 95 |
| Lighthouse Best Practices | ≥ 90 |
| LCP (Largest Contentful Paint) | < 2.5s |
| FID / INP | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 |

### 14.2 Performance Optimisations

- `next/image` with `priority` on above-fold images
- `next/font` for zero-CLS font loading (Google Fonts via Next.js)
- Route-level code splitting (automatic with App Router)
- MDX articles — static generation at build time
- Tailwind CSS purging (only used classes in production bundle)
- SVG icons — inline (no icon font overhead)
- `loading="lazy"` on all off-screen images
- HTTP/2 + Vercel CDN edge caching

### 14.3 Accessibility (WCAG AA)

- All images have descriptive `alt` text
- Form inputs have associated `<label>` elements
- Color contrast ratio ≥ 4.5:1 for all text on background
  - White on `#0B4E41`: 9.7:1 ✅
  - `#2D3436` on `#FAFAFA`: 12.4:1 ✅
  - `#0B4E41` on `#FCEE21`: 7.2:1 ✅
- Interactive elements have visible focus rings (`:focus-visible`)
- Accordion uses `aria-expanded`, `aria-controls`, `role="region"`
- Modal uses focus trap, `aria-modal`, `role="dialog"`
- Skip-to-content link at top of page
- Landmark roles: `<header>`, `<nav>`, `<main>`, `<footer>`
- Reduced-motion media query respected (`@media (prefers-reduced-motion: reduce)`)

---

## 15. Build Phases & Milestones

### Phase 1 — Foundation (Week 1–2)

- [ ] `npx create-next-app@latest` with TypeScript + Tailwind v4 + App Router
- [ ] Install all dependencies (Framer Motion, React Hook Form, Zod, Resend, etc.)
- [ ] Configure `tailwind.config.ts` with full design token system
- [ ] Set up `globals.css` with CSS custom properties
- [ ] Configure `next/font` for Cormorant Garamond + Plus Jakarta Sans
- [ ] Configure `next.config.ts` (image domains, strict mode)
- [ ] Set up ESLint + Prettier + Husky
- [ ] Build `Navbar` component (desktop + mobile)
- [ ] Build `Footer` component
- [ ] Build `Button`, `Card`, `Badge` UI primitives
- [ ] Configure `.env.local.example` with required vars

**Deliverable:** Blank site with correct navigation, design system, and deployment on Vercel preview URL.

---

### Phase 2 — Core Content (Week 3–4)

- [ ] Home page — all 5 sections (Hero, Pillars, V-Vault preview, Welcome, Latest Resources)
- [ ] Logo SVG creation and animation
- [ ] About page — Mission/Vision, Dr. Didi bio, Team, Partners
- [ ] Outreach page — Impact metrics + gallery grid
- [ ] Library index page — category filters + article card grid
- [ ] 6 MDX articles with prototype content
- [ ] All prototype data files (`team.ts`, `outreach.ts`, `vault-preview.ts`)

**Deliverable:** Fully browsable content prototype, all pages populated with real images and prototype copy.

---

### Phase 3 — Interactive Features (Week 5–6)

- [ ] Library article detail page (`/library/[slug]`)
- [ ] V-Vault anonymous submission form + `/api/vault` route
- [ ] Contact booking calendar + enquiry form + `/api/contact` route
- [ ] Resend email integration (vault + contact)
- [ ] Gallery lightbox modal
- [ ] All scroll animations and page transitions
- [ ] Accordion FAQ on Vault page
- [ ] Search functionality on Library page (client-side)

**Deliverable:** Fully interactive prototype. Forms submit and send emails. All animations live.

---

### Phase 4 — Polish & Launch (Week 7–8)

- [ ] Full Lighthouse audit — target 90+ on all metrics
- [ ] Image optimisation pass (alt text, sizing, loading priority)
- [ ] WCAG AA accessibility audit + fixes
- [ ] SEO metadata + JSON-LD structured data
- [ ] `robots.txt` and `sitemap.xml` generation
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Responsive testing (375px, 768px, 1280px, 1440px)
- [ ] Rate limiting on API routes
- [ ] Environment variables configured in Vercel dashboard
- [ ] Custom domain configuration
- [ ] `404` and `500` error pages
- [ ] Final QA pass

**Deliverable:** Production-ready deployment at `downbelowwithdrdidi.com`.

---

## 16. Deployment & Infrastructure

### 16.1 Environment Variables

```bash
# .env.local.example

# Resend email API
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx

# Dr. Didi's notification email (never exposed to client)
DIDI_EMAIL=didi@downbelowwithdrdidi.com

# Confirmation email sender address (must be verified in Resend)
FROM_EMAIL=noreply@downbelowwithdrdidi.com

# Public site URL
NEXT_PUBLIC_SITE_URL=https://downbelowwithdrdidi.com
```

### 16.2 Vercel Configuration

```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

### 16.3 Deployment Pipeline

```
Local dev → git push → GitHub → Vercel (auto-deploy)
                                    ↓
                              Preview URL (every branch/PR)
                                    ↓
                              Production (main branch)
                              downbelowwithdrdidi.com
```

### 16.4 Domain & DNS

- Primary domain: `downbelowwithdrdidi.com` (or `.ng` for local audience)
- Vercel handles SSL certificate (Let's Encrypt auto-renew)
- `www` redirect → apex domain

---

## 17. Testing Strategy

### 17.1 Unit Tests (Jest + Testing Library)

- All Zod validation schemas
- `mdx.ts` utility functions (parsing, slugify)
- `utils.ts` helper functions

### 17.2 Component Tests (Testing Library)

- `Button` — all variants render, click handlers fire
- `Accordion` — expands/collapses, keyboard navigation
- `SubmissionForm` — validation errors display, success state renders
- `EnquiryForm` — field validation, submit flow

### 17.3 API Route Tests

- `POST /api/vault` — valid submission, invalid data (400), rate limit (429)
- `POST /api/contact` — valid submission, missing required fields

### 17.4 E2E Tests (Playwright)

| Flow | Steps |
|---|---|
| Browse library | Home → Library → click article → read content |
| Submit vault question | `/vault` → select category → type question → submit → see success |
| Submit contact form | `/contact` → fill all fields → submit → see confirmation |
| Mobile navigation | Open hamburger → navigate to Library → close |

### 17.5 Accessibility Testing

- `axe-core` integrated into Playwright tests
- Manual VoiceOver/NVDA testing on key flows

---

## Appendix A — NPM Setup Script

```bash
# Create project
npx create-next-app@latest down-below-with-dr-didi \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd down-below-with-dr-didi

# Install dependencies
npm install \
  framer-motion \
  react-hook-form \
  @hookform/resolvers \
  zod \
  resend \
  @react-email/components \
  react-day-picker \
  next-mdx-remote \
  lucide-react \
  date-fns \
  reading-time \
  gray-matter

# Dev dependencies
npm install -D \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest \
  jest-environment-jsdom \
  @playwright/test \
  prettier \
  eslint-config-prettier \
  husky \
  lint-staged
```

---

## Appendix B — Key Design Decisions

| Decision | Rationale |
|---|---|
| Next.js App Router over Pages Router | RSC, streaming, better layout nesting |
| Tailwind v4 over v3 | CSS-native variables, better performance |
| MDX for articles | Client can edit content without code changes |
| No database (prototype) | JSON files + MDX for zero-cost, zero-infrastructure prototype |
| Resend over SendGrid | Superior DX, React email templates, generous free tier |
| Framer Motion over CSS-only | Complex SVG animation (logo), page transitions, counters |
| No authentication | V-Vault is anonymity-first; contact form doesn't need accounts |
| ISR for library | Content can be updated without full redeploy |

---

*Implementation Plan v1.0 — Prepared by King Tech Foundation for Down Below With Dr. Didi*  
*kingtech.com.ng · April 2026*

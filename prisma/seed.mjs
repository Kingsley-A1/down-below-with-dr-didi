import nextEnv from '@next/env'
import path from 'node:path'
import { readdir } from 'node:fs/promises'

const { loadEnvConfig } = nextEnv

loadEnvConfig(process.cwd())

import { PrismaPg } from '@prisma/adapter-pg'
const prismaClientModule = await import('@prisma/client')
const PrismaClient =
  prismaClientModule.PrismaClient ?? prismaClientModule.default?.PrismaClient

if (!PrismaClient) {
  throw new Error('PrismaClient constructor not found in @prisma/client module exports')
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('Missing DATABASE_URL environment variable')
}

const SEED_MAX_ATTEMPTS = Number(process.env.SEED_MAX_ATTEMPTS || 5)
const SEED_RETRY_BASE_MS = Number(process.env.SEED_RETRY_BASE_MS || 1500)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getErrorText(error) {
  return [
    error?.code,
    error?.message,
    error?.cause?.code,
    error?.cause?.message,
  ]
    .filter(Boolean)
    .join(' ')
}

function isTransientDatabaseError(error) {
  const text = getErrorText(error)

  return [
    'EAI_AGAIN',
    'ECONNRESET',
    'ETIMEDOUT',
    'P1001',
    'P1002',
    'Connection terminated unexpectedly',
    'getaddrinfo',
    'connect timeout',
  ].some((needle) => text.includes(needle))
}

async function runSeedWithRetry(seedFn) {
  let lastError

  for (let attempt = 1; attempt <= SEED_MAX_ATTEMPTS; attempt += 1) {
    try {
      if (attempt > 1) {
        console.log(`Retrying seed attempt ${attempt}/${SEED_MAX_ATTEMPTS}...`)
      }

      await seedFn()
      return
    } catch (error) {
      lastError = error

      if (!isTransientDatabaseError(error) || attempt === SEED_MAX_ATTEMPTS) {
        throw error
      }

      const delayMs = SEED_RETRY_BASE_MS * attempt
      console.warn(`Transient database error during seed attempt ${attempt}/${SEED_MAX_ATTEMPTS}. Retrying in ${delayMs}ms.`)
      console.warn(getErrorText(error))
      await sleep(delayMs)
    }
  }

  throw lastError
}

function withCockroachConnectionDefaults(value) {
  const url = new URL(value)

  if (!url.searchParams.has('connect_timeout')) {
    url.searchParams.set('connect_timeout', '60')
  }

  return url.toString()
}

const adapter = new PrismaPg({
  connectionString: withCockroachConnectionDefaults(connectionString),
})
const prisma = new PrismaClient({ adapter })

const defaultSiteSettings = {
  siteName: 'Down Below Family Health Initiative',
  tagline: 'Expose in Love, teach, heal, and win the world for God.',
  motto: 'Expose in Love, Teach, Heal, Win.',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://down-below.com',
  primaryWhatsapp: 'https://wa.me/2340000000000',
  contactEmail: 'hello@down-below.com',
  heroHeadline: 'Expose in Love. Teach. Heal. Win.',
  heroBody: 'Faith-based reproductive health education and support for women.',
  heroImageUrl: null,
  heroImageAlt: null,
  footerBlurb:
    'A faith-based family health initiative supporting women through medical guidance, natural wellness, and spiritual encouragement.',
}

function parseAllowedUsers(source) {
  return source
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [email, role] = entry.split(':')
      return {
        email: email.trim().toLowerCase(),
        role: (role || 'editor').trim(),
      }
    })
}

const teamMembers = [
  {
    slug: 'dr-edidiong-ekereuke',
    name: 'Dr. Mrs Edidiong Ekereuke',
    role: 'Founder & Executive Director',
    tier: 'founder',
    sortOrder: 0,
    credentials: 'Senior Medical Official, UCTH',
    bio: "Faith-based women's health advocate focused on infertility management, reproductive education, and practical support for women and families.",
    imageUrl: '/assets/dr_didi_2.jpg',
    imageAlt: 'Dr. Mrs Edidiong Ekereuke, Founder of Down Below Family Health Initiative',
    status: 'published',
  },
  {
    slug: 'mrs-glory-victor-etienem',
    name: 'Mrs. Glory Victor Etienem',
    role: 'Head of Administration',
    tier: 'core',
    sortOrder: 1,
    credentials: '',
    bio: 'Head of Administration for Down Below Family Health Initiative.',
    imageUrl: '/assets/Mrs-Glory-Victor-Etienem-Head-of-Adminstration.jpg',
    imageAlt: 'Mrs. Glory Victor Etienem, Head of Administration',
    status: 'published',
  },
  {
    slug: 'mr-etoma-eugene',
    name: 'Mr. Etoma Eugene',
    role: 'General Secretary',
    tier: 'core',
    sortOrder: 2,
    credentials: '',
    bio: 'Secretary for Down Below Family Health Initiative.',
    imageUrl: '/assets/Mr-Etoma-Eugene-Secetrait.jpg',
    imageAlt: 'Mr. Etoma Eugene, Secretary',
    status: 'published',
  },
  {
    slug: 'mrs-ebani-clarkson-agbor',
    name: 'Mrs. Ebani Clarkson Agbor',
    role: 'Financial Secretary',
    tier: 'core',
    sortOrder: 3,
    credentials: '',
    bio: 'Financial Secretary for Down Below Family Health Initiative.',
    imageUrl: '/assets/Mrs-Ebani-Carkson-Agbor-Financial-Secretary.jpg',
    imageAlt: 'Mrs. Ebani Clarkson Agbor, Financial Secretary',
    status: 'published',
  },
  {
    slug: 'mrs-gift-bunchi-abang',
    name: 'Mrs. Gift Bunchi Abang',
    role: 'Public Relations Officer',
    tier: 'core',
    sortOrder: 4,
    credentials: '',
    bio: 'Public Relations Officer for Down Below Family Health Initiative.',
    imageUrl: '/assets/Mrs-Gift-Bunchi-Abang-Public-Relation-Officer.jpg',
    imageAlt: 'Mrs. Gift Bunchi Abang, Public Relations Officer',
    status: 'published',
  },
]

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const EXCLUDED_GALLERY_FILES = new Set([
  'founder-led-health-mobilization.jpg',
])

function normalizeStem(fileName) {
  return fileName.replace(/\.[^.]+$/, '')
}

function toSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toTitleCase(value) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      if (/^\d+$/.test(word)) return word
      if (/^WA\d+$/i.test(word)) return word.toUpperCase()
      if (word.toLowerCase() === 'dr') return 'Dr.'
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

function formatTitleFromStem(stem) {
  const normalized = stem
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\bhopital\b/gi, 'hospital')
    .replace(/\bphyscal\b/gi, 'physical')
    .replace(/\bannivessary\b/gi, 'anniversary')

  const imgCodeMatch = normalized.match(/^IMG\s+\d+\s+WA\d+$/i)
  if (imgCodeMatch) {
    const code = normalized.match(/WA\d+/i)?.[0]?.toUpperCase() || 'FIELD'
    return `Outreach Field Photo ${code}`
  }

  return toTitleCase(normalized)
}

function inferGalleryCategory(stem) {
  const lower = stem.toLowerCase()

  if (
    lower.includes('hospital') ||
    lower.includes('hopital') ||
    lower.includes('facility') ||
    lower.includes('bed renewal') ||
    lower.includes('bed')
  ) {
    return 'facility'
  }

  if (lower.includes('community')) {
    return 'community'
  }

  if (lower.includes('outreach') || lower.startsWith('img-') || lower.includes('admin')) {
    return 'outreach'
  }

  if (
    lower.includes('meeting') ||
    lower.includes('anniversary') ||
    lower.includes('mobilization') ||
    lower.includes('event')
  ) {
    return 'event'
  }

  return 'event'
}

function inferDescription(category, title) {
  if (category === 'outreach') {
    return `Documented outreach moment from Down Below Family Health Initiative, highlighting ${title.toLowerCase()} and practical field support.`
  }

  if (category === 'community') {
    return `Community engagement moment from Down Below Family Health Initiative, featuring ${title.toLowerCase()} and local participation.`
  }

  if (category === 'facility') {
    return `Facility-focused documentation from Down Below Family Health Initiative, featuring ${title.toLowerCase()} and service delivery context.`
  }

  return `Event documentation from Down Below Family Health Initiative, capturing ${title.toLowerCase()} in a structured programme setting.`
}

async function buildGalleryImages() {
  const assetsDir = path.join(process.cwd(), 'public', 'assets')
  const files = await readdir(assetsDir)

  const teamImageFiles = new Set(
    teamMembers
      .map((member) => member.imageUrl)
      .filter(Boolean)
      .map((url) => url.split('/').pop().toLowerCase())
  )

  const galleryFiles = files
    .filter((fileName) => IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
    .filter((fileName) => !teamImageFiles.has(fileName.toLowerCase()))
    .filter((fileName) => !EXCLUDED_GALLERY_FILES.has(fileName.toLowerCase()))
    .sort((a, b) => a.localeCompare(b))

  return galleryFiles.map((fileName) => {
    const stem = normalizeStem(fileName)
    const title = formatTitleFromStem(stem)
    const category = inferGalleryCategory(stem)

    return {
      slug: toSlug(stem),
      title,
      category,
      imageUrl: `/assets/${fileName}`,
      imageAlt: title,
      description: inferDescription(category, title),
      status: 'published',
    }
  })
}

const siteAlerts = []

const reviews = [
  {
    displayName: 'Blessing Akpan',
    roleLabel: 'Community outreach participant',
    location: 'Calabar South',
    rating: 5,
    body:
      'Down Below made women in my community feel seen and respected. The team explained sensitive health topics clearly, gave practical support, and still treated every person with dignity.',
    adminReply:
      'Thank you, Blessing. This is exactly why we keep combining education, practical support, and compassionate presence in the field.',
    status: 'published',
    source: 'seed',
    sortOrder: 0,
    publishedAt: new Date('2026-05-15T00:00:00.000Z'),
  },
  {
    displayName: 'Mary Udo',
    roleLabel: 'Event attendee',
    location: 'Cross River',
    rating: 5,
    body:
      'The session helped me ask questions I used to keep quiet about. I left with better understanding, confidence, and a clear next step for getting proper care.',
    adminReply:
      'We are grateful this helped you take the next step. Quiet questions deserve clear, safe answers.',
    status: 'published',
    source: 'seed',
    sortOrder: 1,
    publishedAt: new Date('2026-05-15T00:00:00.000Z'),
  },
]

const libraryArticles = [
  {
    slug: 'understanding-your-cycle',
    title: 'Understanding Your Menstrual Cycle',
    excerpt: 'A plain-language guide to the four phases of your cycle and what your body is doing at each stage.',
    category: 'menstrual',
    coverImageUrl: '/assets/IMG-20260508-WA0032.jpg',
    readTime: 6,
    publishedAt: new Date('2024-03-15T00:00:00.000Z'),
    content: [
      'Your menstrual cycle is a monthly hormonal process that prepares your body for possible pregnancy. Understanding it gives you power over your health, your fertility, and your wellbeing.',
      'The average cycle is 28 days, though anywhere from 21 to 35 days is considered normal. It has four distinct phases, each driven by different hormones.',
      'Menstruation begins the cycle. The uterine lining sheds because pregnancy did not occur, and oestrogen and progesterone are at their lowest.',
      'The follicular phase starts as follicle-stimulating hormone prompts the ovaries to develop follicles. Oestrogen rises and thickens the uterine lining.',
      'Ovulation happens when a surge in luteinising hormone releases a mature egg. This is your most fertile window, and the egg lives for about 12 to 24 hours.',
      'Speak with a clinician if cycles are consistently under 21 days or over 35 days, bleeding is very heavy, or pain limits normal activity.',
    ].join('\n\n'),
  },
  {
    slug: 'menstrual-hygiene-guide',
    title: 'The Complete Menstrual Hygiene Guide',
    excerpt: 'Everything you need to know about period products and staying healthy during your period.',
    category: 'menstrual',
    coverImageUrl: '/assets/IMG-20260508-WA0033.jpg',
    readTime: 8,
    publishedAt: new Date('2024-02-20T00:00:00.000Z'),
    content: [
      'Good menstrual hygiene is essential for your health and comfort. Understanding your options lets you choose what fits your body, lifestyle, and budget.',
      'Disposable pads are widely used and should be changed every four to six hours to reduce odour and irritation. Choose absorbency based on your flow.',
      'Tampons absorb flow internally and should be changed every four to eight hours. Never leave a tampon in for more than eight hours.',
      'Menstrual cups are reusable silicone cups that can be worn for up to 12 hours. They are cost-effective over time but require proper cleaning and sterilisation.',
      'Always wash your hands before and after changing menstrual products. Do not flush pads, tampons, or wipes down the toilet.',
      'A strong unpleasant odour, itching, pelvic pain, or unusual discharge should be checked by a clinician.',
    ].join('\n\n'),
  },
  {
    slug: 'sti-prevention-basics',
    title: 'STI Prevention: What Every Woman Should Know',
    excerpt: 'Understanding sexually transmitted infections, how they spread, and the most effective prevention strategies.',
    category: 'sexual-wellness',
    coverImageUrl: '/assets/IMG-20260508-WA0034.jpg',
    readTime: 7,
    publishedAt: new Date('2024-01-10T00:00:00.000Z'),
    content: [
      'Sexually transmitted infections are more common than many people realise, and many are preventable or treatable when handled early.',
      'Common STIs include HIV, chlamydia, gonorrhoea, syphilis, herpes, HPV, and hepatitis B.',
      'STIs can spread through vaginal, anal, or oral sex. Some infections can also spread through skin-to-skin genital contact.',
      'Consistent and correct condom use reduces risk for many STIs. Vaccination also protects against HPV and hepatitis B.',
      'Regular testing matters because many STIs have no early symptoms. A person can feel well and still transmit an infection.',
      'If you think you may have an STI, avoid self-medication. See a qualified clinician for testing, treatment, and partner guidance.',
    ].join('\n\n'),
  },
  {
    slug: 'pap-smear-what-to-expect',
    title: 'Pap Smear: What to Expect and Why It Matters',
    excerpt: 'A step-by-step explanation of pap smear screening, what happens, and why it matters.',
    category: 'preventative',
    coverImageUrl: '/assets/IMG-20260508-WA0061.jpg',
    readTime: 5,
    publishedAt: new Date('2024-01-05T00:00:00.000Z'),
    content: [
      'A pap smear is a cervical screening test that detects abnormal cervical cells before they develop into cervical cancer.',
      'The test checks for cell changes in the cervix, including changes linked to human papillomavirus, which is a major cause of cervical cancer.',
      'During the test, a speculum is gently inserted so the cervix can be seen. A small brush collects cells from the cervix.',
      'The procedure usually takes only a few minutes. You may feel pressure or mild discomfort, but it should not be painful.',
      'Most results are normal. If abnormal cells are found, it does not automatically mean cancer. It means follow-up is needed.',
    ].join('\n\n'),
  },
  {
    slug: 'female-anatomy-overview',
    title: 'Your Body, Explained: Female Reproductive Anatomy',
    excerpt: 'A comprehensive overview of the female reproductive system in plain language.',
    category: 'anatomy',
    coverImageUrl: '/assets/IMG-20260508-WA0068.jpg',
    readTime: 10,
    publishedAt: new Date('2023-12-01T00:00:00.000Z'),
    content: [
      'Understanding your anatomy is a form of self-respect. Many women were never given accurate, judgment-free information about their bodies.',
      'The vulva is the external genital area. It includes the mons pubis, labia majora, labia minora, clitoris, vaginal opening, and urethral opening.',
      'The vagina and urethra are separate openings. The vagina connects to the cervix; the urethra is where urine exits.',
      'The cervix is the lower part of the uterus. The uterus is a muscular organ that sheds its lining during menstruation and can carry pregnancy.',
      'The fallopian tubes carry eggs from the ovaries toward the uterus, and fertilisation often happens there. The ovaries produce eggs and hormones.',
    ].join('\n\n'),
  },
  {
    slug: 'contraception-options',
    title: 'Contraception Options: A Complete Guide',
    excerpt: 'Comparing contraception methods, effectiveness, side effects, and what may be right for you.',
    category: 'sexual-wellness',
    coverImageUrl: '/assets/IMG-20260508-WA0073.jpg',
    readTime: 9,
    publishedAt: new Date('2023-11-15T00:00:00.000Z'),
    content: [
      'Choosing contraception is personal. The right option depends on your health, relationship, lifestyle, and future family plans.',
      'Condoms are barrier methods and are the only contraceptives that also reduce STI risk when used correctly.',
      'Hormonal options include pills, implants, injectables, and other clinician-prescribed methods. They work in different ways and may have side effects.',
      'Long-acting reversible contraceptives, such as implants and IUDs, are highly effective and useful for people who want reliable protection without daily action.',
      'No method is perfect for everyone. Speak with a qualified clinician before choosing or changing contraception, especially if you have medical conditions.',
    ].join('\n\n'),
  },
]

async function seedTeamMembers() {
  console.log('Seeding team members...')

  for (const member of teamMembers) {
    await prisma.teamMember.upsert({
      where: { slug: member.slug },
      update: {
        name: member.name,
        role: member.role,
        tier: member.tier,
        sortOrder: member.sortOrder,
        credentials: member.credentials,
        bio: member.bio,
        imageUrl: member.imageUrl,
        imageAlt: member.imageAlt,
        status: member.status,
      },
      create: member,
    })
  }

  const currentSlugs = teamMembers.map((member) => member.slug)
  const deleteResult = await prisma.teamMember.deleteMany({
    where: {
      slug: {
        notIn: currentSlugs,
      },
    },
  })

  console.log(`  ✓ ${deleteResult.count} stale team members deleted`)
  console.log(`  ✓ ${teamMembers.length} team members seeded`)
}

async function seedGalleryImages() {
  console.log('Seeding gallery images...')

  const galleryImages = await buildGalleryImages()

  for (const image of galleryImages) {
    await prisma.galleryImage.upsert({
      where: { slug: image.slug },
      update: {
        title: image.title,
        category: image.category,
        imageUrl: image.imageUrl,
        imageAlt: image.imageAlt,
        description: image.description,
        status: image.status,
      },
      create: image,
    })
  }

  const currentSlugs = galleryImages.map((image) => image.slug)
  const deleteResult = await prisma.galleryImage.deleteMany({
    where: {
      slug: {
        notIn: currentSlugs,
      },
    },
  })

  console.log(`  ✓ ${deleteResult.count} stale gallery images deleted`)
  console.log(`  ✓ ${galleryImages.length} gallery images seeded`)
}

async function seedSiteAlerts() {
  console.log('Seeding site alerts...')

  if (siteAlerts.length === 0) {
    console.log('  - No default site alerts configured')
    return
  }

  for (const alert of siteAlerts) {
    const existing = await prisma.siteAlert.findFirst({
      where: { text: alert.text },
    })

    if (existing) {
      await prisma.siteAlert.update({
        where: { id: existing.id },
        data: {
          speed: alert.speed,
          durationSeconds: alert.durationSeconds,
          isActive: alert.isActive,
          startsAt: alert.startsAt,
          endsAt: alert.endsAt,
        },
      })
      continue
    }

    await prisma.siteAlert.create({
      data: alert,
    })
  }

  console.log(`  ✓ ${siteAlerts.length} site alert seeded`)
}

async function seedReviews() {
  console.log('Seeding reviews...')

  for (const review of reviews) {
    const existing = await prisma.review.findFirst({
      where: {
        displayName: review.displayName,
        source: 'seed',
      },
    })

    const data = {
      ...review,
      adminReplyAuthorEmail: 'seed@down-below.local',
      adminRepliedAt: review.adminReply ? new Date('2026-05-15T00:00:00.000Z') : null,
    }

    if (existing) {
      await prisma.review.update({
        where: { id: existing.id },
        data,
      })
      continue
    }

    await prisma.review.create({ data })
  }

  console.log(`  ✓ ${reviews.length} reviews seeded`)
}

async function seedLibraryArticles() {
  console.log('Seeding library articles...')

  for (const article of libraryArticles) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        category: article.category,
        coverImageUrl: article.coverImageUrl,
        readTime: article.readTime,
        status: 'published',
        publishedAt: article.publishedAt,
      },
      create: {
        ...article,
        status: 'published',
      },
    })
  }

  console.log(`  ✓ ${libraryArticles.length} library articles seeded`)
}

async function main() {
  await prisma.siteSettings.upsert({
    where: { scope: 'global' },
    update: defaultSiteSettings,
    create: {
      scope: 'global',
      ...defaultSiteSettings,
    },
  })

  const allowedUsers = parseAllowedUsers(process.env.ADMIN_ALLOWED_USERS || '')

  for (const user of allowedUsers) {
    await prisma.adminUser.upsert({
      where: { email: user.email },
      update: { role: user.role, isActive: true },
      create: {
        email: user.email,
        role: user.role,
      },
    })
  }

  await seedTeamMembers()
  await seedGalleryImages()
  await seedSiteAlerts()
  await seedLibraryArticles()
  await seedReviews()
}

runSeedWithRetry(main)
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })

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

const adapter = new PrismaPg({ connectionString })
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
    name: 'Dr. Edidiong Ekereuke',
    role: 'Founder & Executive Director',
    tier: 'founder',
    sortOrder: 0,
    credentials: 'Senior Medical Official, UCTH',
    bio: "Faith-based women's health advocate focused on infertility management, reproductive education, and practical support for women and families.",
    imageUrl: '/assets/dr_didi_2.jpg',
    imageAlt: 'Dr. Edidiong Ekereuke, Founder of Down Below Family Health Initiative',
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
    slug: 'mrs-gift-bunchi-abang',
    name: 'Mrs. Gift Bunchi Abang',
    role: 'Public Relations Officer',
    tier: 'core',
    sortOrder: 2,
    credentials: '',
    bio: 'Public Relations Officer for Down Below Family Health Initiative.',
    imageUrl: '/assets/Mrs-Gift-Bunchi-Abang-Public-Relation-Officer.jpg',
    imageAlt: 'Mrs. Gift Bunchi Abang, Public Relations Officer',
    status: 'published',
  },
  {
    slug: 'mr-etoma-eugene',
    name: 'Mr. Etoma Eugene',
    role: 'Secretary',
    tier: 'core',
    sortOrder: 3,
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
    sortOrder: 4,
    credentials: '',
    bio: 'Financial Secretary for Down Below Family Health Initiative.',
    imageUrl: '/assets/Mrs-Ebani-Carkson-Agbor-Financial-Secretary.jpg',
    imageAlt: 'Mrs. Ebani Clarkson Agbor, Financial Secretary',
    status: 'published',
  },
]

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

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

function inferEventName(category) {
  if (category === 'outreach') return 'Community Outreach Programme'
  if (category === 'community') return 'Community Engagement Activity'
  if (category === 'facility') return 'Facility Support and Upgrade'
  return 'Down Below Initiative Event'
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
    .sort((a, b) => a.localeCompare(b))

  return galleryFiles.map((fileName, index) => {
    const stem = normalizeStem(fileName)
    const title = formatTitleFromStem(stem)
    const category = inferGalleryCategory(stem)

    return {
      slug: toSlug(stem),
      title,
      category,
      eventName: inferEventName(category),
      location: 'Cross River, Nigeria',
      sortOrder: index,
      imageUrl: `/assets/${fileName}`,
      imageAlt: title,
      description: inferDescription(category, title),
      caption: title,
      status: 'published',
    }
  })
}

const siteAlerts = [
  {
    text:
      'Work in Progress: The website is currently being improved. If you notice anything you dislike, please reach out on 09036826272.',
    speed: 100,
    durationSeconds: 24,
    isActive: true,
    startsAt: new Date('2026-05-11T00:00:00.000Z'),
    endsAt: null,
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
        eventName: image.eventName,
        location: image.location,
        sortOrder: image.sortOrder,
        imageUrl: image.imageUrl,
        imageAlt: image.imageAlt,
        description: image.description,
        caption: image.caption,
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
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })

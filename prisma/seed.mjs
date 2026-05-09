import nextEnv from '@next/env'

const { loadEnvConfig } = nextEnv

loadEnvConfig(process.cwd())

import { PrismaPg } from '@prisma/adapter-pg'
const { PrismaClient } = await import('@prisma/client')

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('Missing DATABASE_URL environment variable')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const defaultSiteSettings = {
  siteName: 'Down Below Family Health Initiative with Dr. Didi',
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
    role: 'Founder & Lead Physician',
    tier: 'founder',
    sortOrder: 0,
    credentials: 'Senior Medical Official, UCTH',
    bio: "Faith-based women's health advocate focused on infertility management, reproductive education, and practical support for women and families.",
    imageUrl: '/assets/dr-didi_1.jpg',
    imageAlt: 'Dr. Edidiong Ekereuke, Founder of Down Below Family Health Initiative',
    status: 'published',
  },
  {
    slug: 'ngozi-eze',
    name: 'Ngozi Eze',
    role: 'Community Health Officer',
    tier: 'core',
    sortOrder: 1,
    credentials: 'BSc Public Health',
    bio: 'Leads outreach programs in underserved communities across Cross River State. Champions maternal health initiatives at grassroots level.',
    imageUrl: '/assets/admin_1.jpg',
    imageAlt: 'Ngozi Eze, Community Health Officer',
    status: 'published',
  },
  {
    slug: 'amaka-obi',
    name: 'Amaka Obi',
    role: 'Health Communications Lead',
    tier: 'core',
    sortOrder: 2,
    credentials: 'BA Communications',
    bio: 'Social media strategy and health literacy content for young women. Bridges the gap between clinical knowledge and everyday language.',
    imageUrl: '/assets/IMG-20260508-WA0081.jpg',
    imageAlt: 'Amaka Obi, Health Communications Lead',
    status: 'published',
  },
]

const galleryImages = [
  {
    slug: 'calabar-community-support-drive-2024',
    title: 'Community Support Distribution in Calabar South',
    category: 'outreach',
    eventName: 'Community Support Drive',
    location: 'Calabar South, Cross River',
    sortOrder: 0,
    imageUrl: '/assets/admin_1.jpg',
    imageAlt: 'Volunteers distributing support materials during a community outreach in Calabar South',
    description:
      'This outreach captured a structured distribution session where women and families received support materials in a respectful, community-first environment. Alongside distribution, the team shared practical reproductive health guidance and directed participants to follow-up channels for continued care.',
    caption: 'Community support distribution in Calabar South',
    status: 'published',
  },
  {
    slug: 'calabar-main-collection-point-2024',
    title: 'Main Collection Point Coordination and Beneficiary Support',
    category: 'community',
    eventName: 'Community Support Drive',
    location: 'Calabar South, Cross River',
    sortOrder: 1,
    imageUrl: '/assets/IMG-20260508-WA0083.jpg',
    imageAlt: 'Large crowd and volunteers coordinating distribution at a neighborhood collection point',
    description:
      "At the main collection point, the team coordinated beneficiary flow and item sorting to serve people safely and efficiently. The event combined practical aid delivery with confidence-building conversations about women's wellness and family health pathways.",
    caption: 'Main collection point coordination',
    status: 'published',
  },
  {
    slug: 'dr-didi-field-engagement-2024',
    title: 'Dr. Didi Field Engagement During Community Outreach',
    category: 'team',
    eventName: 'Down Below Community Outreach',
    location: 'Calabar South, Cross River',
    sortOrder: 2,
    imageUrl: '/assets/IMG-20260508-WA0082.jpg',
    imageAlt: 'Dr. Didi engaging directly with women during an outreach support session',
    description:
      "Dr. Didi is shown in active field engagement, supporting women directly during distribution and community interaction. The moment reflects the initiative's model of combining practical service, trust, and clear health communication at grassroots level.",
    caption: 'Dr. Didi in direct field engagement',
    status: 'published',
  },
  {
    slug: 'outreach-team-on-site-operations-2024',
    title: 'Outreach Team Operations and On-Site Coordination',
    category: 'outreach',
    eventName: 'Community Support Drive',
    location: 'Calabar South, Cross River',
    sortOrder: 3,
    imageUrl: '/assets/IMG-20260508-WA0081.jpg',
    imageAlt: 'Outreach volunteers in branded shirts organizing materials for distribution',
    description:
      'This image highlights the operational side of the outreach as volunteers coordinated inventory, sorting, and distribution sequencing. Strong on-site coordination helped maintain dignity for beneficiaries while keeping the event timely and inclusive.',
    caption: 'On-site volunteer coordination',
    status: 'published',
  },
  {
    slug: 'community-gathering-health-awareness-2024',
    title: 'Community Gathering for Health Awareness and Support',
    category: 'community',
    eventName: 'Community Awareness Session',
    location: 'Cross River State',
    sortOrder: 4,
    imageUrl: '/assets/IMG-20260508-WA0079.jpg',
    imageAlt: 'Community members gathered under canopies during a support and awareness session',
    description:
      'A broad community gathering brought women, families, and local leaders together for coordinated support and health awareness. The session strengthened trust between the initiative and the community while reinforcing practical steps for reproductive wellness follow-up.',
    caption: 'Community awareness gathering',
    status: 'published',
  },
  {
    slug: 'founder-led-health-mobilization-calabar-2024',
    title: 'Founder-Led Public Health Mobilization in Calabar',
    category: 'event',
    eventName: "Women's Health Mobilization Event",
    location: 'Calabar, Cross River',
    sortOrder: 5,
    imageUrl: '/assets/IMG-20260508-WA0060.jpg',
    imageAlt: 'Dr. Didi speaking with a microphone during a women\'s health mobilization event',
    description:
      "Dr. Didi leads a public-facing mobilization moment focused on education, confidence, and action for women's health. The event atmosphere captures the initiative's core approach: clinical clarity, compassionate communication, and strong community participation.",
    caption: 'Founder-led public health mobilization',
    status: 'published',
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
  console.log(`  ✓ ${teamMembers.length} team members seeded`)
}

async function seedGalleryImages() {
  console.log('Seeding gallery images...')
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
  console.log(`  ✓ ${galleryImages.length} gallery images seeded`)
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
import nextEnv from '@next/env'

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
    role: 'Founder & Lead Physician',
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
    imageUrl: '/assets/dr_didi_hospital_bed_renewal_2.jpg',
    imageAlt: 'Dr. Didi standing with clinical partners during a hospital bed renewal outreach',
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
    imageUrl: '/assets/breast_cancer_outreach_dr_didi_speaking.jpg',
    imageAlt: 'Dr. Didi speaking with a microphone during a women\'s health mobilization event',
    description:
      "Dr. Didi leads a public-facing mobilization moment focused on education, confidence, and action for women's health. The event atmosphere captures the initiative's core approach: clinical clarity, compassionate communication, and strong community participation.",
    caption: 'Founder-led public health mobilization',
    status: 'published',
  },
]

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

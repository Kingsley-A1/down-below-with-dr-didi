import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const { PrismaClient } = await import('@prisma/client')

const prisma = new PrismaClient()

const defaultSiteSettings = {
  siteName: 'Down Below Family Health Initiative with Dr. Didi',
  tagline: 'Expose in Love, teach, heal, and win the world for God.',
  motto: 'Expose in Love, Teach, Heal, Win.',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://down-below.com.ng',
  primaryWhatsapp: 'https://wa.me/2340000000000',
  contactEmail: 'hello@down-below.com.ng',
  heroHeadline: 'Expose in Love. Teach. Heal. Win.',
  heroBody:
    'A faith-based family health initiative helping women with evidence-based education, compassionate guidance, and practical support.',
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
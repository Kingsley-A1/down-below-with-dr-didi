export const siteConfig = {
  name: 'Down Below Family Health Initiative',
  shortName: 'Down Below Family',
  founderName: 'Dr. Didi',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://down-below.com',
  alternateNames: [
    'Down Below With Dr. Didi',
    'Down Below Family Health Initiative with Dr. Didi',
    'Down Below Family Health Initiative Nigeria',
    'Down Below women health platform',
  ],
  tagline: 'Expose in Love, teach, heal, and win the world for God.',
  motto: 'Expose in Love, Teach, Heal, Win.',
  description:
    'Down Below Family Health Initiative is a faith-based women and family health platform led by Dr. Didi, blending clinical care, reproductive health education, natural wellness guidance, and spiritual support.',
  primaryWhatsapp: 'https://wa.me/2340000000000',
  contactEmail: 'hello@down-below.com',
  heroHeadline: 'Expose in Love. Teach. Heal. Win.',
  heroBody: 'Faith-based reproductive health education and support for women.',
  footerBlurb:
    'A faith-based family health initiative supporting women through medical guidance, natural wellness, and spiritual encouragement.',
}

export const seoKeywords = [
  'Down Below Family Health Initiative',
  'Down Below With Dr. Didi',
  'Down Below Dr Didi',
  'Dr. Didi',
  'Dr Didi Nigeria',
  'Dr Edidiong Ekereuke',
  'women health Nigeria',
  'women health NGO Nigeria',
  'family health initiative Nigeria',
  'reproductive health Nigeria',
  'sexual reproductive health Nigeria',
  'SRH Nigeria',
  'faith based health initiative',
  'faith based women health',
  'Calabar women health',
  'Cross River women health',
  'Cross River health outreach',
  'women health education Calabar',
  'infertility support Nigeria',
  'fertility awareness Nigeria',
  'menstrual health education',
  'menstrual hygiene Nigeria',
  'sexual wellness education',
  'cervical cancer screening education',
  'pap smear education Nigeria',
  'breast cancer awareness Nigeria',
  'female reproductive health',
  'female anatomy education',
  'contraception education Nigeria',
  'family planning education Nigeria',
  'anonymous women health questions',
  'V-Vault anonymous health questions',
  'women health podcast Nigeria',
  'community health outreach Nigeria',
  'natural wellness for women',
  'maternal wellness support',
  'Down Below podcast',
  'Down Below health library',
]

export function canonicalUrl(path = '/') {
  const base = siteConfig.siteUrl.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return normalizedPath === '/' ? `${base}/` : `${base}${normalizedPath}`
}

export type SiteSettingsState = {
  siteName: string
  tagline: string
  motto: string
  siteUrl: string
  primaryWhatsapp: string
  contactEmail: string
  heroHeadline: string
  heroBody: string
  heroImageUrl: string
  heroImageAlt: string
  footerBlurb: string
}

export const defaultSiteSettings: SiteSettingsState = {
  siteName: siteConfig.name,
  tagline: siteConfig.tagline,
  motto: siteConfig.motto,
  siteUrl: siteConfig.siteUrl,
  primaryWhatsapp: siteConfig.primaryWhatsapp,
  contactEmail: siteConfig.contactEmail,
  heroHeadline: siteConfig.heroHeadline,
  heroBody: siteConfig.heroBody,
  heroImageUrl: '',
  heroImageAlt: '',
  footerBlurb: siteConfig.footerBlurb,
}

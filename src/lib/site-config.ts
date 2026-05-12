export const siteConfig = {
  name: 'DownBelow Family  Health Initiatives with Dr. Didi',
  shortName: 'DownBelow Family',
  founderName: 'Dr. Didi',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://down-below.com',
  alternateNames: [
    'Down Below With Dr. Didi',
    'Down Below Family Health Initiative with Dr. Didi',
    'DownBelow Family  Health Initiatives with Dr. Didi',
    'DOWNBELOW FAMILY HEALTH INITIATIVE WITH DR DIDI',
    'Down Below Family Health Initiative Nigeria',
    'Down Below women health platform',
  ],
  tagline: 'Non-profit and non-denominational Christian ministry preserving the family unit for God.',
  motto: 'Expose In Love. Educate. Heal.',
  description:
    'DownBelow Family  Health Initiatives with Dr. Didi provides accessible and reliable information on family, sexuality, and health through open discussions, medical lectures, community outreach, and supportive engagement.',
  primaryWhatsapp: 'https://wa.me/2348034404652',
  contactEmail: 'downbelowwithdrdidi@gmail.com',
  heroHeadline: 'Expose In Love. Educate. Heal.',
  heroBody: 'A safe and non-judgmental space for individuals, couples, and families to ask, learn, and grow.',
  footerBlurb:
    'We promote holistic well-being, healthy relationships, and informed decision-making for individuals and families worldwide.',
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

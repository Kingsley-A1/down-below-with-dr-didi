export const siteConfig = {
  name: 'Down Below Family Health Initiative with Dr. Didi',
  shortName: 'Down Below Family',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://down-below.com.ng',
  tagline: 'Expose in Love, teach, heal, and win the world for God.',
  motto: 'Expose in Love, Teach, Heal, Win.',
  description:
    'A faith-based family health initiative led by Dr. Didi, blending clinical care, natural wellness guidance, and spiritual support for women.',
  primaryWhatsapp: 'https://wa.me/2340000000000',
  contactEmail: 'hello@down-below.com.ng',
  heroHeadline: 'Expose in Love. Teach. Heal. Win.',
  heroBody:
    'A faith-based family health initiative helping women with evidence-based education, compassionate guidance, and practical support.',
  footerBlurb:
    'A faith-based family health initiative supporting women through medical guidance, natural wellness, and spiritual encouragement.',
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
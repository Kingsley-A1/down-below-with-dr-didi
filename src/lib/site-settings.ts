import { getSiteSettings } from '@/lib/admin/repository'
import { defaultSiteSettings, siteConfig, type SiteSettingsState } from '@/lib/site-config'

const LEGACY_SITE_NAMES = new Set(['Down Below Family Health Initiative with Dr. Didi'])
const LEGACY_SITE_URLS = new Set(['https://down-below.com.ng'])
const LEGACY_CONTACT_EMAILS = new Set(['hello@down-below.com.ng'])

function normalizeLegacySettings(settings: SiteSettingsState): SiteSettingsState {
  return {
    ...settings,
    siteName: LEGACY_SITE_NAMES.has(settings.siteName) ? siteConfig.name : settings.siteName,
    siteUrl: LEGACY_SITE_URLS.has(settings.siteUrl) ? siteConfig.siteUrl : settings.siteUrl,
    contactEmail: LEGACY_CONTACT_EMAILS.has(settings.contactEmail) ? siteConfig.contactEmail : settings.contactEmail,
  }
}

export async function getPublicSiteSettings() {
  try {
    return normalizeLegacySettings(await getSiteSettings())
  } catch {
    // Public pages should still render if the database is temporarily unreachable.
    return defaultSiteSettings
  }
}

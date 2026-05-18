import { getSiteSettings } from '@/lib/admin/repository'
import { readPublicDatabase } from '@/lib/public-database'
import { defaultSiteSettings, siteConfig, type SiteSettingsState } from '@/lib/site-config'

const LEGACY_SITE_NAMES = new Set([
  'Down Below Family Health Initiative with Dr. Didi',
  'Down Below Family Health Initiative',
])
const LEGACY_SITE_URLS = new Set(['https://down-below.com'])
const LEGACY_CONTACT_EMAILS = new Set(['hello@down-below.com'])

function normalizeLegacySettings(settings: SiteSettingsState): SiteSettingsState {
  return {
    ...settings,
    siteName: LEGACY_SITE_NAMES.has(settings.siteName) ? siteConfig.name : settings.siteName,
    siteUrl: LEGACY_SITE_URLS.has(settings.siteUrl) ? siteConfig.siteUrl : settings.siteUrl,
    contactEmail: LEGACY_CONTACT_EMAILS.has(settings.contactEmail) ? siteConfig.contactEmail : settings.contactEmail,
  }
}

function logPublicSettingsFallback(context: string, error: unknown): void {
  if (process.env.NODE_ENV === 'test') {
    return
  }

  const message = error instanceof Error ? error.message : String(error)
  console.warn('[site-settings.public.fallback]', {
    context,
    message,
    timestamp: new Date().toISOString(),
  })
}

export async function getPublicSiteSettings(): Promise<SiteSettingsState> {
  return readPublicDatabase({
    context: 'site.settings',
    fallback: defaultSiteSettings,
    query: async () => normalizeLegacySettings(await getSiteSettings()),
    onError: logPublicSettingsFallback,
  })
}

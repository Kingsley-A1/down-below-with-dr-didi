import { getSiteSettings } from '@/lib/admin/repository'
import { defaultSiteSettings } from '@/lib/site-config'

export async function getPublicSiteSettings() {
  try {
    return await getSiteSettings()
  } catch {
    // Public pages should still render if the database is temporarily unreachable.
    return defaultSiteSettings
  }
}

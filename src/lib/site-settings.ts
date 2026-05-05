import { getSiteSettings } from '@/lib/admin/repository'

export async function getPublicSiteSettings() {
  return getSiteSettings()
}

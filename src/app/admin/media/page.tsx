import MediaLibrary from '@/components/admin/MediaLibrary'
import { listMediaAssets } from '@/lib/admin/repository'

export const dynamic = 'force-dynamic'

export default async function AdminMediaPage() {
  const assets = await listMediaAssets()

  return <MediaLibrary initialAssets={assets} />
}
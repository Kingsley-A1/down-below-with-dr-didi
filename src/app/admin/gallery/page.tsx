import GalleryImagesBoard from '@/components/admin/GalleryImagesBoard'
import { getAllGalleryImages } from '@/lib/admin/repository'

export const dynamic = 'force-dynamic'

export default async function AdminGalleryPage() {
  let images: Awaited<ReturnType<typeof getAllGalleryImages>>
  try {
    images = await getAllGalleryImages()
  } catch {
    images = []
  }

  return <GalleryImagesBoard initialImages={images} />
}

export type UploadedAsset = {
  id: string
  label: string
  url: string
  mimeType: string
  sizeBytes: number
  kind: 'image' | 'audio' | 'document' | 'video' | 'other'
}

export async function uploadAdminMediaAsset(file: File, label: string, altText = '') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('label', label)
  formData.append('altText', altText)

  const response = await fetch('/api/admin/media', {
    method: 'POST',
    body: formData,
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || `Upload failed for ${file.name}`)
  }

  return result.asset as UploadedAsset
}

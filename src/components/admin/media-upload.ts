export type UploadedAsset = {
  id: string
  label: string
  url: string
  mimeType: string
  sizeBytes: number
  kind: 'image' | 'audio' | 'document' | 'video' | 'other'
}

type UploadAdminMediaOptions = {
  onProgress?: (progress: number) => void
}

function parseUploadResponse<T>(raw: string): T & { error?: string } {
  if (!raw.trim()) {
    return {} as T & { error?: string }
  }

  try {
    return JSON.parse(raw) as T & { error?: string }
  } catch {
    return { error: raw.slice(0, 240) } as T & { error?: string }
  }
}

async function requestJson<T>(url: string, payload: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const text = await response.text()
  const data = parseUploadResponse<T>(text)

  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data as T
}

function uploadFileToSignedUrl(file: File, uploadUrl: string, options: UploadAdminMediaOptions) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest()

    request.open('PUT', uploadUrl)
    request.responseType = 'text'
    request.setRequestHeader('Content-Type', file.type || 'application/octet-stream')

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return
      }

      options.onProgress?.((event.loaded / event.total) * 100)
    }

    request.onerror = () => {
      reject(new Error(`Upload failed for ${file.name}. Check your connection and try again.`))
    }

    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        const result = parseUploadResponse<{ error?: string }>(request.responseText)
        reject(new Error(result.error || `Upload failed for ${file.name}`))
        return
      }

      options.onProgress?.(100)
      resolve()
    }

    request.send(file)
  })
}

export async function uploadAdminMediaAsset(
  file: File,
  label: string,
  altText = '',
  options: UploadAdminMediaOptions = {}
) {
  const normalizedMimeType = file.type || 'application/octet-stream'
  const presign = await requestJson<{
    uploadUrl: string
    storageKey: string
    bucket: string
    url: string
    kind: UploadedAsset['kind']
  }>('/api/admin/media/presign', {
    fileName: file.name,
    mimeType: normalizedMimeType,
    sizeBytes: file.size,
    label,
    altText,
  })

  await uploadFileToSignedUrl(file, presign.uploadUrl, options)

  const complete = await requestJson<{ asset: UploadedAsset }>('/api/admin/media/complete', {
    label,
    storageKey: presign.storageKey,
    bucket: presign.bucket,
    url: presign.url,
    mimeType: normalizedMimeType,
    sizeBytes: file.size,
    altText,
  })

  return complete.asset
}

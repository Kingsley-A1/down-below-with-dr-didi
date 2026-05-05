import { randomUUID } from 'crypto'
import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { env, hasR2Config } from '@/lib/env'

export function getR2Client() {
  if (!hasR2Config()) {
    throw new Error('Cloudflare R2 is not configured')
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  })
}

export function buildAssetStorageKey(fileName: string) {
  const sanitized = fileName.toLowerCase().replace(/[^a-z0-9.\-]+/g, '-')
  return `media/${new Date().getFullYear()}/${randomUUID()}-${sanitized}`
}

export function buildPublicAssetUrl(storageKey: string) {
  if (env.R2_PUBLIC_URL) {
    return `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${storageKey}`
  }

  return `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${storageKey}`
}

export async function uploadAssetToR2(input: {
  fileName: string
  body: Buffer
  contentType: string
}) {
  const client = getR2Client()
  const storageKey = buildAssetStorageKey(input.fileName)

  const upload = new Upload({
    client,
    params: {
      Bucket: env.R2_BUCKET,
      Key: storageKey,
      Body: input.body,
      ContentType: input.contentType,
    },
  })

  await upload.done()

  return {
    storageKey,
    bucket: env.R2_BUCKET,
    url: buildPublicAssetUrl(storageKey),
  }
}
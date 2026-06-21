import { PutBucketCorsCommand, S3Client } from '@aws-sdk/client-s3'

const requiredKeys = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET']
const missingKeys = requiredKeys.filter((key) => !process.env[key]?.trim())

if (missingKeys.length > 0) {
  throw new Error(`Missing required R2 configuration: ${missingKeys.join(', ')}`)
}

const configuredOrigins = (process.env.R2_CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)
const allowedOrigins = Array.from(new Set([
  'https://down-below.com',
  'https://www.down-below.com',
  'http://localhost:3000',
  ...configuredOrigins,
]))

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

await client.send(new PutBucketCorsCommand({
  Bucket: process.env.R2_BUCKET,
  CORSConfiguration: {
    CORSRules: [{
      AllowedOrigins: allowedOrigins,
      AllowedMethods: ['PUT', 'GET', 'HEAD'],
      AllowedHeaders: ['Content-Type'],
      ExposeHeaders: ['ETag'],
      MaxAgeSeconds: 3600,
    }],
  },
}))

console.log(`Configured R2 CORS for ${process.env.R2_BUCKET}: ${allowedOrigins.join(', ')}`)

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

let connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('Missing DATABASE_URL environment variable')
}

// Optimize connection pooling for concurrent requests
// Add pooling parameters if not already present
const poolParams = {
  pool_size: '20', // Increased from default 10 for better concurrency
  pool_timeout: '30', // 30 seconds timeout for waiting for connection
  pool_recycle: '3600', // Recycle connections every hour
  application_name: 'down_below_app',
}

// Check if URL already has these params
const urlObj = new URL(connectionString)
Object.entries(poolParams).forEach(([key, value]) => {
  if (!urlObj.searchParams.has(key)) {
    urlObj.searchParams.set(key, value)
  }
})
connectionString = urlObj.toString()

const adapter = new PrismaPg({ connectionString })

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // Log only errors and warnings in development to reduce I/O
    log:
      process.env.NODE_ENV === 'production'
        ? ['error']
        : ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
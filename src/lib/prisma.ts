import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('Missing DATABASE_URL environment variable')
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

const poolConfig = {
  connectionString,
  max: readPositiveInteger(process.env.DATABASE_POOL_MAX, 10),
  connectionTimeoutMillis: readPositiveInteger(process.env.DATABASE_CONNECT_TIMEOUT_MS, 10_000),
  idleTimeoutMillis: readPositiveInteger(process.env.DATABASE_IDLE_TIMEOUT_MS, 30_000),
  maxLifetimeSeconds: readPositiveInteger(process.env.DATABASE_POOL_MAX_LIFETIME_SECONDS, 900),
  application_name: 'down_below_app',
}

const adapter = new PrismaPg(poolConfig)

function createPrismaClient() {
  return new PrismaClient({
    adapter,
    // Log only errors and warnings in development to reduce I/O
    log:
      process.env.NODE_ENV === 'production'
        ? ['error']
        : ['error', 'warn'],
  })
}

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

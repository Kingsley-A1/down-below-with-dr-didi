import { loadEnvConfig } from '@next/env'
import { defineConfig, env } from 'prisma/config'

loadEnvConfig(process.cwd())

function withCockroachConnectionDefaults(connectionString: string): string {
  const url = new URL(connectionString)

  if (!url.searchParams.has('connect_timeout')) {
    url.searchParams.set('connect_timeout', '60')
  }

  return url.toString()
}

const databaseUrl = withCockroachConnectionDefaults(env('DATABASE_URL'))
const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL
  ? withCockroachConnectionDefaults(process.env.SHADOW_DATABASE_URL)
  : undefined

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
    ...(shadowDatabaseUrl ? { shadowDatabaseUrl } : {}),
  },
  enums: {
    external: ['public.crdb_internal_region'],
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.mjs',
  },
})

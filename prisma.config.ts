import { loadEnvConfig } from '@next/env'
import { defineConfig, env } from 'prisma/config'

loadEnvConfig(process.cwd())

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  enums: {
    external: ['public.crdb_internal_region'],
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.mjs',
  },
})
import { loadEnvConfig } from '@next/env'

// Ensure Jest picks up .env / .env.local for modules that read process.env at import time.
loadEnvConfig(process.cwd())

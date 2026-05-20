import { env, getAdminEnv } from '@/lib/env'
import { normaliseAdminRole, type AdminRole } from '@/lib/admin/rbac'

export const ADMIN_SESSION_COOKIE = 'dbfh_admin_session'

type AdminRegistrationRole = 'super_admin' | 'founder_admin' | 'editor' | 'moderator'

export type AdminSession = {
  email: string
  role: AdminRole
  expiresAt: string
}

type SessionPayload = {
  email: string
  role: AdminRole
  exp: number
}

function toBase64(value: string | Uint8Array) {
  if (typeof value === 'string') {
    if (typeof btoa === 'function') {
      return btoa(value)
    }

    return Buffer.from(value, 'utf8').toString('base64')
  }

  let binary = ''
  value.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  if (typeof btoa === 'function') {
    return btoa(binary)
  }

  return Buffer.from(binary, 'binary').toString('base64')
}

function fromBase64(value: string) {
  if (typeof atob === 'function') {
    return atob(value)
  }

  return Buffer.from(value, 'base64').toString('binary')
}

function toBase64Url(value: string | Uint8Array) {
  return toBase64(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string) {
  const normalised = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = `${normalised}${'='.repeat((4 - (normalised.length % 4 || 4)) % 4)}`
  return fromBase64(padded)
}

function textToBytes(value: string) {
  return new TextEncoder().encode(value)
}

let cachedSecretKey: { secret: string; promise: Promise<CryptoKey> } | null = null

function getAdminSecretKey() {
  const adminEnv = getAdminEnv()

  if (cachedSecretKey?.secret === adminEnv.ADMIN_SESSION_SECRET) {
    return cachedSecretKey.promise
  }

  const promise = crypto.subtle.importKey(
    'raw',
    textToBytes(adminEnv.ADMIN_SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  cachedSecretKey = { secret: adminEnv.ADMIN_SESSION_SECRET, promise }
  return promise
}

async function signPayload(payload: string) {
  const secretKey = await getAdminSecretKey()

  const signature = await crypto.subtle.sign('HMAC', secretKey, textToBytes(payload))

  return new Uint8Array(signature)
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false
  }

  let result = 0

  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }

  return result === 0
}

export async function createAdminSessionToken(input: { email: string; role: AdminRole }) {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 8
  const payload: SessionPayload = {
    email: input.email.trim().toLowerCase(),
    role: input.role,
    exp: expiresAt,
  }

  const payloadJson = JSON.stringify(payload)
  const signature = await signPayload(payloadJson)

  return `${toBase64Url(payloadJson)}.${toBase64Url(signature)}`
}

export async function verifyAdminSession(token: string | undefined) {
  if (!token) {
    return null
  }

  const [payloadSegment, signatureSegment] = token.split('.')

  if (!payloadSegment || !signatureSegment) {
    return null
  }

  const payloadJson = fromBase64Url(payloadSegment)
  const expectedSignature = toBase64Url(await signPayload(payloadJson))

  if (!safeEqual(expectedSignature, signatureSegment)) {
    return null
  }

  const parsed = JSON.parse(payloadJson) as SessionPayload

  if (!parsed.email || parsed.exp <= Date.now()) {
    return null
  }

  return {
    email: parsed.email,
    role: normaliseAdminRole(parsed.role),
    expiresAt: new Date(parsed.exp).toISOString(),
  } satisfies AdminSession
}

export function resolveAdminRegistrationRole(accessCode: string): AdminRegistrationRole | null {
  const trimmedAccessCode = accessCode.trim()

  if (!trimmedAccessCode) {
    return null
  }

  const adminEnv = getAdminEnv()
  const configuredRoleCodes: Array<{ role: AdminRegistrationRole; code: string }> = [
    { role: 'moderator', code: adminEnv.ADMIN_ACCESS_CODE },
    { role: 'super_admin', code: adminEnv.ADMIN_SUPER_ADMIN_ACCESS_CODE },
    { role: 'founder_admin', code: adminEnv.ADMIN_FOUNDER_ADMIN_ACCESS_CODE },
    { role: 'editor', code: adminEnv.ADMIN_EDITOR_ACCESS_CODE },
  ]
  const roleCodes = configuredRoleCodes.filter((entry) => entry.code)

  for (const entry of roleCodes) {
    if (safeEqual(entry.code, trimmedAccessCode)) {
      return entry.role
    }
  }

  return null
}

export function sessionCookieOptions(expiresAt: string) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt),
  }
}

import { env } from '@/lib/env'
import { normaliseAdminRole, type AdminRole } from '@/lib/admin/rbac'

export const ADMIN_SESSION_COOKIE = 'dbfh_admin_session'

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

function bytesToText(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes)
}

async function signPayload(payload: string) {
  const secretKey = await crypto.subtle.importKey(
    'raw',
    textToBytes(env.ADMIN_SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

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

export function parseAllowedAdminUsers() {
  return env.ADMIN_ALLOWED_USERS.split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [email, role] = entry.split(':')

      return {
        email: email.trim().toLowerCase(),
        role: normaliseAdminRole(role?.trim()),
      }
    })
}

export function getAllowedAdminUser(email: string) {
  return parseAllowedAdminUsers().find((entry) => entry.email === email.trim().toLowerCase()) || null
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
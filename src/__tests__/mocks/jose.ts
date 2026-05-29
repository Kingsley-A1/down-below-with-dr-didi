type JwtPayload = Record<string, unknown>

function parseExpiryToSeconds(value: string | number): number {
  if (typeof value === 'number') {
    return value
  }

  const match = /^(\d+)([smhd])$/.exec(value.trim())
  if (!match) {
    return Math.floor(Date.now() / 1000) + 60 * 60
  }

  const amount = Number(match[1])
  const unit = match[2]

  if (unit === 's') return Math.floor(Date.now() / 1000) + amount
  if (unit === 'm') return Math.floor(Date.now() / 1000) + amount * 60
  if (unit === 'h') return Math.floor(Date.now() / 1000) + amount * 60 * 60

  return Math.floor(Date.now() / 1000) + amount * 24 * 60 * 60
}

function encodePayload(payload: JwtPayload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

function decodePayload(token: string): JwtPayload {
  return JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as JwtPayload
}

export class SignJWT {
  private payload: JwtPayload

  constructor(payload: JwtPayload) {
    this.payload = { ...payload }
  }

  setProtectedHeader(header: Record<string, unknown>) {
    void header
    return this
  }

  setIssuedAt() {
    this.payload.iat = Math.floor(Date.now() / 1000)
    return this
  }

  setExpirationTime(value: string | number) {
    this.payload.exp = parseExpiryToSeconds(value)
    return this
  }

  async sign(secret: Uint8Array) {
    void secret
    return encodePayload(this.payload)
  }
}

export async function jwtVerify(token: string, secret: Uint8Array) {
  void secret
  const payload = decodePayload(token)

  if (typeof payload.exp === 'number' && payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired')
  }

  return {
    payload,
    protectedHeader: { alg: 'HS256' },
  }
}

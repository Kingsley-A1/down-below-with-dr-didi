/**
 * Domain errors thrown by admin / user repository functions. Route handlers
 * map these to the standard error response shape via @/lib/api/errors.
 */

export class DuplicateEmailError extends Error {
  constructor(public readonly email: string) {
    super(`Email already registered: ${email}`)
    this.name = 'DuplicateEmailError'
  }
}

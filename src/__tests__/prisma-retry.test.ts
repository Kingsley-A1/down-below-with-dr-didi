import { describe, expect, it, jest } from '@jest/globals'
import { isTransientPrismaTransactionError, withPrismaRetry } from '@/lib/prisma-retry'

describe('Prisma retry helpers', () => {
  it('recognizes Cockroach transaction conflicts and expired transactions', () => {
    expect(isTransientPrismaTransactionError({ code: 'P2034', message: 'Transaction failed due to a write conflict' })).toBe(true)
    expect(
      isTransientPrismaTransactionError({
        code: 'P2028',
        message: 'A commit cannot be executed on an expired transaction. Please retry your transaction.',
      })
    ).toBe(true)
  })

  it('does not treat ambiguous connection failures as safe transaction retries', () => {
    expect(isTransientPrismaTransactionError({ code: 'P1001', message: "Can't reach database server" })).toBe(false)
  })

  it('uses the caller supplied retry classifier', async () => {
    const operation = jest
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce({ code: 'P2034', message: 'write conflict' })
      .mockResolvedValueOnce('ok')

    await expect(
      withPrismaRetry(operation, {
        attempts: 2,
        delayMs: 1,
        shouldRetry: isTransientPrismaTransactionError,
      })
    ).resolves.toBe('ok')
    expect(operation).toHaveBeenCalledTimes(2)
  })
})

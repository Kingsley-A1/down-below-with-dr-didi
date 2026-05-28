import { hasDatabaseConfig } from '@/lib/env'
import type { AdminSession } from '@/lib/admin/session'

export async function validateAdminSessionWithDatabase(
  session: AdminSession | null
): Promise<AdminSession | null> {
  if (!session) {
    return null
  }

  if (!hasDatabaseConfig()) {
    return session
  }

  try {
    const { prisma } = await import('@/lib/prisma')
    const account = await prisma.adminUser.findUnique({
      where: { email: session.email },
      select: {
        role: true,
        isActive: true,
        emailVerified: true,
        tokenVersion: true,
      },
    })

    if (!account || !account.isActive || !account.emailVerified) {
      return null
    }

    if ((account.tokenVersion ?? 0) !== session.tokenVersion) {
      return null
    }

    return {
      ...session,
      role: account.role,
    }
  } catch (error) {
    console.error('[admin-session] DB validation failed', error)
    return null
  }
}

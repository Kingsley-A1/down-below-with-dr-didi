import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'

/**
 * GET /api/auth/session
 * Return current authentication state.
 */
export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        {
          success: true,
          authenticated: false,
          user: null,
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        authenticated: true,
        user: session,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check session',
      },
      { status: 500 }
    )
  }
}

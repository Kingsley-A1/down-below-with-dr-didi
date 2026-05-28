import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { serverError } from '@/lib/api/errors'

/**
 * GET /api/auth/session
 * Return current authentication state.
 */
export async function GET(request: NextRequest) {
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
    return serverError('Failed to check session', { request, error })
  }
}

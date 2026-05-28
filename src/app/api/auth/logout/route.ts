import { NextRequest, NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth/session'
import { serverError } from '@/lib/api/errors'

export async function POST(request: NextRequest) {
  try {
    await clearSession()

    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    return serverError('Logout failed', { request, error })
  }
}

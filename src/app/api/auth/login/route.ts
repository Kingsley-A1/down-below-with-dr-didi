import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/admin/user-repository'
import { createSession } from '@/lib/auth/session'
import { userLoginSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = userLoginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // Authenticate user
    const user = await authenticateUser(email, password)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please verify your email before logging in',
        },
        { status: 403 }
      )
    }

    // Create session
    await createSession({
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      },
      { status: 500 }
    )
  }
}

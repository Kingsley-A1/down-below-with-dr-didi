import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/admin/user-repository'
import { sendEmailVerification } from '@/lib/auth/email'
import { userRegisterSchema } from '@/lib/validations'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = userRegisterSchema.safeParse(body)
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

    const { email, displayName, password } = validation.data

    // Create user
    const result = await createUser(email, displayName, password)
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 400 }
      )
    }

    // Send verification email
    const verificationUrl = `${API_URL}/verify-email?token=${result.verificationToken}`
    const emailResult = await sendEmailVerification(email, verificationUrl)

    if (!emailResult.success) {
      console.warn('Email verification send failed, but user created:', emailResult.error)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        user: result.user,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      },
      { status: 500 }
    )
  }
}

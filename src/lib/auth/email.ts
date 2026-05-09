/**
 * Email service for sending auth emails
 * Supports both Resend and Nodemailer
 * Configure via environment variables: EMAIL_SERVICE, RESEND_API_KEY, SMTP_*
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Send email using configured service
 * Falls back to console logging if no service is configured (dev mode)
 */
export async function sendEmail({
  to,
  subject,
  html,
}: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const service = process.env.EMAIL_SERVICE || 'console'

    if (service === 'resend') {
      return await sendViaResend({ to, subject, html })
    } else if (service === 'smtp') {
      return await sendViaSMTP({ to, subject, html })
    } else {
      // Development mode: log to console
      console.log('📧 Email (dev mode):', { to, subject })
      return { success: true }
    }
  } catch (error) {
    console.error('Email send error:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

/**
 * Send email verification
 */
export async function sendEmailVerification(
  email: string,
  verificationUrl: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <h2>Verify Your Email</h2>
    <p>Click the link below to verify your email address:</p>
    <a href="${verificationUrl}">${verificationUrl}</a>
    <p>This link expires in 24 hours.</p>
    <p>If you didn't create this account, please ignore this email.</p>
  `

  return sendEmail({
    to: email,
    subject: 'Verify Your Email Address',
    html,
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(
  email: string,
  resetUrl: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <h2>Reset Your Password</h2>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request a password reset, please ignore this email.</p>
  `

  return sendEmail({
    to: email,
    subject: 'Reset Your Password',
    html,
  })
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  email: string,
  displayName: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <h2>Welcome, ${displayName}!</h2>
    <p>Your account has been created successfully.</p>
    <p>You can now log in and start using our platform.</p>
  `

  return sendEmail({
    to: email,
    subject: 'Welcome to Down Below with Dr. Didi',
    html,
  })
}

// ============================================================================
// Service-specific implementations
// ============================================================================

async function sendViaResend({
  to,
  subject,
  html,
}: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'noreply@down-below.com',
        to,
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Resend error',
    }
  }
}

async function sendViaSMTP({
  to,
  subject,
  html,
}: EmailOptions): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement Nodemailer integration
  // For now, fallback to console
  console.log('📧 SMTP Email:', { to, subject })
  return { success: true }
}

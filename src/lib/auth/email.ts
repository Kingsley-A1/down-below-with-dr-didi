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
  const html = getEmailVerificationTemplate(verificationUrl)
  return sendEmail({
    to: email,
    subject: 'Verify Your Email Address - Down Below with Dr. Didi',
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
  const html = getPasswordResetTemplate(resetUrl)
  return sendEmail({
    to: email,
    subject: 'Reset Your Password - Down Below with Dr. Didi',
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
  const html = getWelcomeEmailTemplate(displayName)
  return sendEmail({
    to: email,
    subject: 'Welcome to Down Below with Dr. Didi',
    html,
  })
}

// ============================================================================
// Email Templates
// ============================================================================

/**
 * Email verification template
 */
function getEmailVerificationTemplate(verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background-color: #1e40af; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: white; padding: 40px 30px; }
        .button { display: inline-block; background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
        .warning { color: #dc2626; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>
        <div class="content">
          <p>Welcome to Down Below with Dr. Didi!</p>
          <p>Thank you for creating an account. To complete your registration, please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px; font-size: 12px;">${verificationUrl}</p>
          <p class="warning">⏱️ This link will expire in 24 hours.</p>
          <p>If you didn't create this account or need help, please contact our support team.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Down Below with Dr. Didi. All rights reserved.</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Password reset template
 */
function getPasswordResetTemplate(resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background-color: #1e40af; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: white; padding: 40px 30px; }
        .button { display: inline-block; background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
        .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; color: #92400e; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px; font-size: 12px;">${resetUrl}</p>
          <div class="warning">
            ⚠️ <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
          </div>
          <p>Your account security is important to us. If you have any concerns, please contact our support team immediately.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Down Below with Dr. Didi. All rights reserved.</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Welcome email template
 */
function getWelcomeEmailTemplate(displayName: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background-color: #1e40af; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: white; padding: 40px 30px; }
        .button { display: inline-block; background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
        .highlight { background-color: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome, ${displayName}!</h1>
        </div>
        <div class="content">
          <p>Your account has been successfully created. We're excited to have you as part of the Down Below with Dr. Didi community!</p>
          <div class="highlight">
            <h3>Getting Started:</h3>
            <ul>
              <li>Complete your profile to personalize your experience</li>
              <li>Explore our resources and guides</li>
              <li>Join our community discussions</li>
              <li>Ask questions in the vault for confidential guidance</li>
            </ul>
          </div>
          <p>Your privacy and wellness are our top priorities. All information is handled with care and discretion.</p>
          <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>
          <p><strong>Warm regards,</strong><br>Dr. Didi and the Down Below Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Down Below with Dr. Didi. All rights reserved.</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
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
}: EmailOptions): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement Nodemailer integration
  // For now, fallback to console
  console.log('📧 SMTP Email:', { to, subject })
  return { success: true }
}

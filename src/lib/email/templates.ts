/**
 * Email templates. Each template is a pure function that returns a fully
 * composed `{ subject, html, text }` payload. Keep markup inline so it renders
 * in every email client; no JavaScript. Promote to @react-email/render later
 * without changing callers.
 */

import { env } from '@/lib/env'

const BRAND_SHORT_NAME = 'DownBelow'
const BRAND_NAME = 'DownBelow Family Health Initiative'
const BRAND_TAGLINE = 'with Dr. Didi'
const BRAND_FULL_NAME = `${BRAND_NAME} ${BRAND_TAGLINE}`
const BRAND_LOGO_PATH = '/logo.jpg'

// Palette aligned with the admin / site brand (emerald-forward).
const COLOR = {
  ink: '#0b1220', // primary text
  body: '#1f2937', // body copy
  muted: '#5f6f82', // secondary text
  border: '#dbe3ea', // hairline borders
  accent: '#0b4e41', // primary brand emerald
  accentStrong: '#073f35',
  accentSoft: '#eaf7f1', // tonal accent background
  accentWash: '#f6fbf8',
  accentInk: '#075943', // text on tonal accents
  bg: '#f4f7f6', // page background
  card: '#ffffff',
  divider: '#edf2f4',
  warningBg: '#fffbeb',
  warningBorder: '#d97706',
  warningInk: '#92400e',
}

interface TemplateOutput {
  subject: string
  html: string
  text: string
}

interface DetailListItem {
  label: string
  value: string
}

function escape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function absoluteAssetUrl(path: string) {
  return new URL(path, env.NEXT_PUBLIC_SITE_URL).toString()
}

function brandHeader() {
  const logoUrl = absoluteAssetUrl(BRAND_LOGO_PATH)

  return `
    <tr>
      <td class="email-pad" style="padding:22px 30px 18px 30px;background:${COLOR.card};border-bottom:1px solid ${COLOR.divider};">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="52" valign="middle" style="width:52px;">
              <img src="${escape(logoUrl)}" width="44" height="44" alt="${escape(BRAND_SHORT_NAME)} logo" style="display:block;width:44px;height:44px;border:1px solid ${COLOR.border};border-radius:12px;object-fit:cover;background:${COLOR.accent};" />
            </td>
            <td valign="middle" style="padding-left:12px;">
              <p class="email-brand-name" style="margin:0;font-size:15px;line-height:1.25;font-weight:800;letter-spacing:0;color:${COLOR.ink};">${escape(BRAND_SHORT_NAME)}</p>
              <p style="margin:3px 0 0 0;font-size:12.5px;line-height:1.4;color:${COLOR.muted};">${escape(BRAND_TAGLINE)}</p>
              <p style="margin:5px 0 0 0;font-size:11px;line-height:1.35;font-weight:700;color:${COLOR.accentInk};">Secure account message</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
}

function shell({
  title,
  preheader,
  kicker,
  heading,
  bodyHtml,
  footerNote = `You received this because this email is connected to a ${BRAND_SHORT_NAME} account or request.`,
}: {
  title: string
  preheader: string
  kicker: string
  heading: string
  bodyHtml: string
  footerNote?: string
}) {
  const year = new Date().getUTCFullYear()

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escape(title)}</title>
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; }
      @media screen and (max-width: 620px) {
        .email-shell { padding: 18px 10px !important; }
        .email-card { width: 100% !important; max-width: 100% !important; border-radius: 16px !important; }
        .email-pad { padding-left: 20px !important; padding-right: 20px !important; }
        .email-hero { padding-top: 24px !important; padding-bottom: 22px !important; }
        .email-heading { font-size: 24px !important; line-height: 1.2 !important; }
        .email-button a { display: block !important; text-align: center !important; }
        .email-detail-label, .email-detail-value { display: block !important; width: 100% !important; text-align: left !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${COLOR.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${COLOR.body};-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;">
    <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${COLOR.bg};">${escape(preheader)}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${COLOR.bg};">
      <tr>
        <td class="email-shell" align="center" style="padding:24px 12px;">
          <table class="email-card" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;max-width:560px;table-layout:fixed;background:${COLOR.card};border-radius:18px;overflow:hidden;border:1px solid ${COLOR.border};box-shadow:0 1px 2px rgba(15,23,42,0.04);">
            <tr>
              <td style="height:3px;background:${COLOR.accent};font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            ${brandHeader()}
            <tr>
              <td bgcolor="${COLOR.accentWash}" class="email-pad email-hero" style="padding:26px 30px 24px 30px;background:${COLOR.accentWash};border-bottom:1px solid ${COLOR.divider};">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td>
                      <span style="display:inline-block;margin:0 0 10px 0;font-size:11px;font-weight:800;letter-spacing:0.13em;text-transform:uppercase;color:${COLOR.accentInk};">${escape(kicker)}</span>
                      <h1 class="email-heading" style="margin:0;font-size:28px;line-height:1.18;font-weight:800;color:${COLOR.ink};letter-spacing:0;">${escape(heading)}</h1>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="email-pad" style="padding:28px 30px 8px 30px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td class="email-pad" style="padding:18px 30px 28px 30px;">
                <div style="height:1px;background:${COLOR.divider};margin:0 0 16px 0;"></div>
                <p style="margin:0;font-size:12px;line-height:1.58;color:${COLOR.muted};">
                  Sent from <strong style="color:${COLOR.ink};font-weight:600;">${escape(BRAND_FULL_NAME)}</strong><br/>
                  ${escape(footerNote)}
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:14px 0 0 0;font-size:11px;line-height:1.45;color:#8b9aab;">© ${year} ${escape(BRAND_FULL_NAME)}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function ctaButton(label: string, href: string) {
  return `<table class="email-button" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0 8px 0;"><tr><td align="left"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:14px;background:${COLOR.accent};"><a href="${escape(href)}" style="display:inline-block;min-width:152px;padding:15px 22px;color:#ffffff;font-weight:800;text-decoration:none;border-radius:14px;font-size:15px;line-height:18px;letter-spacing:0;text-align:center;">${escape(label)}</a></td></tr></table></td></tr></table>`
}

function paragraph(text: string) {
  return `<p style="margin:0 0 15px 0;line-height:1.62;font-size:15px;color:${COLOR.body};">${text}</p>`
}

function muted(text: string) {
  return `<p style="margin:14px 0 0 0;line-height:1.58;font-size:13px;color:${COLOR.muted};">${text}</p>`
}

function fallbackLink(href: string) {
  return `<p style="margin:16px 0 0 0;font-size:12px;color:${COLOR.muted};word-break:break-all;line-height:1.5;">Button not working? Paste this link into your browser:<br/><span style="color:${COLOR.accentInk};font-weight:600;">${escape(href)}</span></p>`
}

function callout(text: string, tone: 'info' | 'warning' = 'info') {
  const styles = tone === 'warning'
    ? {
        background: COLOR.warningBg,
        border: COLOR.warningBorder,
        text: COLOR.warningInk,
      }
    : {
        background: COLOR.accentSoft,
        border: COLOR.accent,
        text: COLOR.accentInk,
      }

  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:18px 0 8px 0;"><tr><td style="background:${styles.background};border:1px solid ${styles.border};border-left-width:4px;border-radius:12px;padding:14px 16px;font-size:13.5px;line-height:1.58;color:${styles.text};">${text}</td></tr></table>`
}

function detailList(items: readonly DetailListItem[]) {
  const rows = items
    .map((item) => `
      <tr>
        <td class="email-detail-label" style="padding:12px 0;border-bottom:1px solid ${COLOR.divider};font-size:11.5px;line-height:1.45;color:${COLOR.muted};font-weight:800;text-transform:uppercase;letter-spacing:0.08em;">${escape(item.label)}</td>
        <td class="email-detail-value" align="right" style="padding:12px 0;border-bottom:1px solid ${COLOR.divider};font-size:14px;line-height:1.45;color:${COLOR.ink};font-weight:700;">${escape(item.value)}</td>
      </tr>
    `)
    .join('')

  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:18px 0;border-top:1px solid ${COLOR.divider};">${rows}</table>`
}

function mailtoLink(email: string, label: string = email) {
  return `<a href="mailto:${escape(email)}" style="color:${COLOR.accentInk};font-weight:700;text-decoration:underline;">${escape(label)}</a>`
}

function truncateText(value: string, maxLength: number) {
  const normalized = value.trim().replace(/\s+/g, ' ')
  if (normalized.length <= maxLength) return normalized

  return `${normalized.slice(0, maxLength - 3).trim()}...`
}

// ─────────────────────────────────────────────────────────────────────────────
// User templates
// ─────────────────────────────────────────────────────────────────────────────

export function verifyEmail(props: {
  recipientName: string
  actionUrl: string
  expiresInMinutes: number
}): TemplateOutput {
  const { recipientName, actionUrl, expiresInMinutes } = props
  const html = shell({
    title: 'Verify your DownBelow email',
    preheader: 'Confirm your email to finish creating your DownBelow account.',
    kicker: 'Email verification',
    heading: `Hi ${recipientName}, verify your email`,
    bodyHtml: `
      ${paragraph('Confirm this is you and activate your DownBelow account by tapping the button below.')}
      ${ctaButton('Verify email', actionUrl)}
      ${muted(`This link expires in ${expiresInMinutes} minutes. After that you'll need to request a new one from the sign-in page.`)}
      ${fallbackLink(actionUrl)}
    `,
  })
  return {
    subject: 'Verify your DownBelow email',
    html,
    text: `Hi ${recipientName},\n\nConfirm your email to finish creating your DownBelow account: ${actionUrl}\n\nThis link expires in ${expiresInMinutes} minutes.`,
  }
}

export function passwordReset(props: {
  recipientName: string
  actionUrl: string
  expiresInMinutes: number
}): TemplateOutput {
  const { recipientName, actionUrl, expiresInMinutes } = props
  const html = shell({
    title: 'Reset your DownBelow password',
    preheader: 'A request was made to reset your DownBelow password.',
    kicker: 'Password reset',
    heading: `Hi ${recipientName}, let's reset your password`,
    bodyHtml: `
      ${paragraph('We received a request to reset your password. Click below to choose a new one.')}
      ${ctaButton('Reset password', actionUrl)}
      ${muted(`This link expires in ${expiresInMinutes} minutes. If you didn't ask to reset your password, you can safely ignore this email.`)}
      ${fallbackLink(actionUrl)}
    `,
  })
  return {
    subject: 'Reset your DownBelow password',
    html,
    text: `Hi ${recipientName},\n\nReset your DownBelow password here: ${actionUrl}\n\nThis link expires in ${expiresInMinutes} minutes.`,
  }
}

export function welcomeUser(props: {
  recipientName: string
  actionUrl: string
}): TemplateOutput {
  const { recipientName, actionUrl } = props
  const html = shell({
    title: 'Welcome to DownBelow',
    preheader: 'Your DownBelow account is verified and ready.',
    kicker: 'Welcome',
    heading: `Welcome, ${recipientName}`,
    bodyHtml: `
      ${paragraph('Your email is verified and your DownBelow account is fully active.')}
      ${ctaButton('Open DownBelow', actionUrl)}
    `,
  })
  return {
    subject: 'Welcome to DownBelow',
    html,
    text: `Welcome, ${recipientName}! Your email is verified. Open DownBelow: ${actionUrl}`,
  }
}

export function passwordChanged(props: {
  recipientName: string
  actionUrl: string
  supportEmail: string
}): TemplateOutput {
  const { recipientName, actionUrl, supportEmail } = props
  const html = shell({
    title: 'Your DownBelow password was changed',
    preheader: 'Confirming a recent password change on your account.',
    kicker: 'Security update',
    heading: `Your password was changed`,
    bodyHtml: `
      ${paragraph(`Hi ${escape(recipientName)} — your DownBelow password was just changed. If this was you, no action is needed.`)}
      ${callout(`Didn't make this change? <a href="mailto:${escape(supportEmail)}" style="color:${COLOR.accentInk};font-weight:600;text-decoration:underline;">Email us</a> immediately and reset your password.`)}
      ${ctaButton('Sign in', actionUrl)}
    `,
  })
  return {
    subject: 'Your DownBelow password was changed',
    html,
    text: `Hi ${recipientName},\n\nYour DownBelow password was just changed. If this wasn't you, contact ${supportEmail} immediately.\n\nSign in: ${actionUrl}`,
  }
}

export function accountDeactivated(props: {
  recipientName: string
  supportEmail: string
}): TemplateOutput {
  const { recipientName, supportEmail } = props
  const html = shell({
    title: 'Your DownBelow account was deactivated',
    preheader: 'Your DownBelow sign-in access has been paused.',
    kicker: 'Account update',
    heading: 'Your account has been deactivated',
    footerNote: 'You received this account-status notice because this email is connected to a DownBelow account.',
    bodyHtml: `
      ${paragraph(`Hi ${escape(recipientName)} - your ${escape(BRAND_SHORT_NAME)} account has been deactivated by our team, so you cannot sign in right now.`)}
      ${detailList([
        { label: 'Account status', value: 'Deactivated' },
        { label: 'Sign-in access', value: 'Paused' },
      ])}
      ${callout(`If you believe this was a mistake or need help with your account, contact us at ${mailtoLink(supportEmail)}.`)}
      ${muted(`Thank you for being part of ${escape(BRAND_SHORT_NAME)}.`)}
    `,
  })
  return {
    subject: 'Your DownBelow account was deactivated',
    html,
    text: `Hi ${recipientName},\n\nYour DownBelow account has been deactivated by our team, so you cannot sign in right now.\n\nIf you believe this was a mistake or need help with your account, contact us at ${supportEmail}.`,
  }
}

export function accountDeleted(props: {
  recipientName: string
  supportEmail: string
}): TemplateOutput {
  const { recipientName, supportEmail } = props
  const html = shell({
    title: 'Your DownBelow account was deleted',
    preheader: 'Your DownBelow account access has been removed.',
    kicker: 'Account update',
    heading: 'Your account has been deleted',
    footerNote: 'You received this final account-status notice because this email was connected to a DownBelow account.',
    bodyHtml: `
      ${paragraph(`Hi ${escape(recipientName)} - your ${escape(BRAND_SHORT_NAME)} account has been deleted by our team, so this email address can no longer be used to sign in.`)}
      ${detailList([
        { label: 'Account status', value: 'Deleted' },
        { label: 'Sign-in access', value: 'Removed' },
      ])}
      ${paragraph('If this was expected, no further action is needed. Some operational records may be retained only where required for safety, compliance, or audit obligations.')}
      ${callout(`If you believe this happened by mistake, contact us at ${mailtoLink(supportEmail)}.`, 'warning')}
      ${muted(`Thank you for being part of ${escape(BRAND_SHORT_NAME)}.`)}
    `,
  })
  return {
    subject: 'Your DownBelow account was deleted',
    html,
    text: `Hi ${recipientName},\n\nYour DownBelow account has been deleted by our team, so this email address can no longer be used to sign in.\n\nIf this was expected, no further action is needed. Some operational records may be retained only where required for safety, compliance, or audit obligations.\n\nIf you believe this happened by mistake, contact us at ${supportEmail}.`,
  }
}

export function vaultResponseReady(props: {
  recipientName: string
  questionPreview: string
  actionUrl: string
}): TemplateOutput {
  const { recipientName, questionPreview, actionUrl } = props
  const messageReference = questionPreview.trim()
    ? 'your recent anonymous V-Vault message'
    : 'your anonymous V-Vault message'
  const plainMessageReference = truncateText(messageReference, 120)
  const html = shell({
    title: 'You have a new V-Vault response',
    preheader: 'Dr. Didi has replied to your anonymous V-Vault message.',
    kicker: 'V-Vault reply',
    heading: 'Dr. Didi replied to your message',
    footerNote: 'You received this because your DownBelow account has private V-Vault inbox activity.',
    bodyHtml: `
      ${paragraph(`Hi ${escape(recipientName)} - Dr. Didi has responded to ${escape(messageReference)}.`)}
      ${detailList([
        { label: 'Status', value: 'Response ready' },
        { label: 'Where to read', value: 'Secure V-Vault inbox' },
      ])}
      ${callout("For privacy, this email does not include your message content or Dr. Didi's full response. Sign in to read it securely.")}
      ${ctaButton('Read the reply', actionUrl)}
      ${fallbackLink(actionUrl)}
      ${muted('Your public anonymity is unchanged. Account sign-in is used only to deliver your private reply securely.')}
    `,
  })
  return {
    subject: 'Dr. Didi replied to your V-Vault message',
    html,
    text: `Hi ${recipientName},\n\nDr. Didi has responded to ${plainMessageReference}.\n\nFor privacy, this email does not include your message content or Dr. Didi's full response.\n\nRead the reply securely: ${actionUrl}`,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin templates
// ─────────────────────────────────────────────────────────────────────────────

export function verifyAdminEmail(props: {
  recipientName: string
  actionUrl: string
  expiresInMinutes: number
  role: string
}): TemplateOutput {
  const { recipientName, actionUrl, expiresInMinutes, role } = props
  const html = shell({
    title: 'Verify your DownBelow admin email',
    preheader: 'Confirm your address to activate your admin access.',
    kicker: 'Admin · email verification',
    heading: `Welcome, ${recipientName}`,
    bodyHtml: `
      ${paragraph(`You've registered for ${escape(BRAND_NAME)} admin access with the <strong>${escape(role)}</strong> role. Verify your email to activate your account.`)}
      ${ctaButton('Verify admin email', actionUrl)}
      ${muted(`This link expires in ${expiresInMinutes} minutes. You won't be able to sign in until verification is complete.`)}
      ${fallbackLink(actionUrl)}
    `,
  })
  return {
    subject: 'Verify your DownBelow admin email',
    html,
    text: `Hi ${recipientName},\n\nVerify your DownBelow admin email (${role}): ${actionUrl}\n\nLink expires in ${expiresInMinutes} minutes.`,
  }
}

export function welcomeAdmin(props: {
  recipientName: string
  actionUrl: string
  role: string
}): TemplateOutput {
  const { recipientName, actionUrl, role } = props
  const html = shell({
    title: 'Your DownBelow admin access is live',
    preheader: 'Admin verification complete — you can sign in now.',
    kicker: 'Admin · access live',
    heading: `You're in, ${recipientName}`,
    bodyHtml: `
      ${paragraph(`Your <strong>${escape(role)}</strong> admin account is verified and active.`)}
      ${ctaButton('Open admin', actionUrl)}
    `,
  })
  return {
    subject: 'Your DownBelow admin access is live',
    html,
    text: `Hi ${recipientName},\n\nYour ${role} admin account is verified. Sign in: ${actionUrl}`,
  }
}

export function adminPasswordReset(props: {
  recipientName: string
  actionUrl: string
  expiresInMinutes: number
}): TemplateOutput {
  const { recipientName, actionUrl, expiresInMinutes } = props
  const html = shell({
    title: 'Reset your DownBelow admin password',
    preheader: 'A request was made to reset your admin password.',
    kicker: 'Admin · password reset',
    heading: `Reset your admin password`,
    bodyHtml: `
      ${paragraph(`Hi ${escape(recipientName)} — use the button below to set a new password for your DownBelow admin account.`)}
      ${ctaButton('Reset admin password', actionUrl)}
      ${muted(`This link expires in ${expiresInMinutes} minutes. If you didn't ask for this, ignore the email and your password stays the same.`)}
      ${fallbackLink(actionUrl)}
    `,
  })
  return {
    subject: 'Reset your DownBelow admin password',
    html,
    text: `Hi ${recipientName},\n\nReset your DownBelow admin password: ${actionUrl}\n\nLink expires in ${expiresInMinutes} minutes.`,
  }
}

export function adminAccountReactivated(props: {
  recipientName: string
  actionUrl: string
}): TemplateOutput {
  const { recipientName, actionUrl } = props
  const html = shell({
    title: 'Your DownBelow admin account is reactivated',
    preheader: 'Recovery complete — sign in to confirm your access.',
    kicker: 'Admin · reactivated',
    heading: `Your admin account is back`,
    bodyHtml: `
      ${paragraph(`Hi ${escape(recipientName)} — your DownBelow admin account has been recovered and reactivated.`)}
      ${ctaButton('Sign in to admin', actionUrl)}
      ${callout(`If you didn't initiate a recovery, contact your super admin immediately.`)}
    `,
  })
  return {
    subject: 'Your DownBelow admin account is reactivated',
    html,
    text: `Hi ${recipientName},\n\nYour DownBelow admin account is reactivated. Sign in: ${actionUrl}\n\nIf you didn't request this, contact your super admin.`,
  }
}

export function adminAccountUpdated(props: {
  recipientName: string
  actionUrl: string
  role: string
  changedFields: string[]
  actorEmail: string
}): TemplateOutput {
  const { recipientName, actionUrl, role, changedFields, actorEmail } = props
  const changedFieldText = changedFields.length > 0 ? changedFields.join(', ') : 'Account details'
  const html = shell({
    title: 'Your DownBelow admin account was updated',
    preheader: 'A super admin updated your DownBelow admin account.',
    kicker: 'Admin · account updated',
    heading: 'Your admin account was updated',
    bodyHtml: `
      ${paragraph(`Hi ${escape(recipientName)} - your DownBelow admin account was updated by ${escape(actorEmail)}.`)}
      ${detailList([
        { label: 'Current role', value: role },
        { label: 'Updated fields', value: changedFieldText },
      ])}
      ${callout(`If this change looks wrong, contact a super admin before continuing sensitive admin work.`, 'warning')}
      ${ctaButton('Open admin sign in', actionUrl)}
      ${fallbackLink(actionUrl)}
    `,
  })
  return {
    subject: 'Your DownBelow admin account was updated',
    html,
    text: `Hi ${recipientName},\n\nYour DownBelow admin account was updated by ${actorEmail}.\n\nCurrent role: ${role}\nUpdated fields: ${changedFieldText}\n\nSign in: ${actionUrl}`,
  }
}

export function adminAccountSuspended(props: {
  recipientName: string
  actorEmail: string
  supportEmail: string
}): TemplateOutput {
  const { recipientName, actorEmail, supportEmail } = props
  const html = shell({
    title: 'Your DownBelow admin account was suspended',
    preheader: 'Your DownBelow admin sign-in access has been paused.',
    kicker: 'Admin · account suspended',
    heading: 'Your admin access is suspended',
    bodyHtml: `
      ${paragraph(`Hi ${escape(recipientName)} - your DownBelow admin account was suspended by ${escape(actorEmail)}. You cannot sign in to the admin console while the account is suspended.`)}
      ${detailList([
        { label: 'Admin status', value: 'Suspended' },
        { label: 'Sign-in access', value: 'Paused' },
      ])}
      ${callout(`If you believe this was a mistake, contact a super admin or email ${mailtoLink(supportEmail)}.`, 'warning')}
    `,
  })
  return {
    subject: 'Your DownBelow admin account was suspended',
    html,
    text: `Hi ${recipientName},\n\nYour DownBelow admin account was suspended by ${actorEmail}. You cannot sign in while the account is suspended.\n\nIf you believe this was a mistake, contact a super admin or email ${supportEmail}.`,
  }
}

export function adminAccountDeleted(props: {
  recipientName: string
  actorEmail: string
  supportEmail: string
}): TemplateOutput {
  const { recipientName, actorEmail, supportEmail } = props
  const html = shell({
    title: 'Your DownBelow admin account was deleted',
    preheader: 'Your DownBelow admin account has been removed.',
    kicker: 'Admin · account deleted',
    heading: 'Your admin account was deleted',
    bodyHtml: `
      ${paragraph(`Hi ${escape(recipientName)} - your DownBelow admin account was deleted by ${escape(actorEmail)}. This email address no longer has admin-console access.`)}
      ${detailList([
        { label: 'Admin status', value: 'Deleted' },
        { label: 'Sign-in access', value: 'Removed' },
      ])}
      ${paragraph('If this was expected, no action is needed. Audit records may remain for security and operational history.')}
      ${callout(`If you believe this was a mistake, contact a super admin or email ${mailtoLink(supportEmail)}.`, 'warning')}
    `,
  })
  return {
    subject: 'Your DownBelow admin account was deleted',
    html,
    text: `Hi ${recipientName},\n\nYour DownBelow admin account was deleted by ${actorEmail}. This email address no longer has admin-console access.\n\nIf this was expected, no action is needed. Audit records may remain for security and operational history.\n\nIf you believe this was a mistake, contact a super admin or email ${supportEmail}.`,
  }
}

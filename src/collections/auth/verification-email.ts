import { emailButton, emailHero, emailPanel, emailPara, emailShell } from '../../lib/email-layout'
// Branded HTML for the account emails (verify your email, reset your password) — Payload's own auth.verify /
// auth.forgotPassword send a plain default otherwise. Same visual style as the developer emails
// (src/lib/developer-invite-email.ts): 600px bordered card, square corners, left-aligned wordmark with the
// real wordmark logo (public/brand/logo-email.png), orange pill button, beige info box, small footer. Logo is a hosted PNG with alt text (mail apps block SVG).
const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function renderAccountEmail({
  title,
  preheader,
  heading,
  intro,
  buttonLabel,
  url,
  noteTitle,
  noteLines,
  after,
}: {
  title: string
  preheader: string
  heading: string
  intro: string
  buttonLabel: string
  url: string
  noteTitle: string
  noteLines: string[]
  after?: string
}): string {
  const body = [
    emailHero(heading, intro),
    emailButton(buttonLabel, url),
    emailPanel({ heading: noteTitle, bodyHtml: noteLines.map((line) => `&bull; ${line}`).join('<br>') }),
    emailPara(`Button not working? Paste this link into your browser:<br><a href="${url}" style="color:#6b6a66;word-break:break-all;">${url}</a>${after ?? ''}`, true),
  ].join('\n')
  return emailShell({ preheader, title, body, footerNote: 'This inbox is not monitored. Reply to a message from us or write to <a href="mailto:support@lankanewhomes.com" style="color:#ffffff;">support@lankanewhomes.com</a> if you need help.' })
}

export function renderVerificationEmailHTML({
  verificationURL,
  loginURL,
}: {
  verificationURL: string
  loginURL: string
}): string {
  return renderAccountEmail({
    title: 'Confirm your email',
    preheader: 'Confirm your email to activate your account on LankaNewHomes.',
    heading: 'Confirm your account',
    intro: 'Your LankaNewHomes account has been created. Confirm your email to activate it and sign in.',
    buttonLabel: 'Confirm your email',
    url: verificationURL,
    noteTitle: 'What happens next',
    noteLines: ['Press the button to confirm this email address.', `Then sign in any time at <a href="${loginURL}" style="color:#1f1f1f;">${esc(loginURL)}</a>.`, "If you didn't create this account, you can ignore this email."],
  })
}

// Same idea for auth.forgotPassword — resetURL is Payload's own built-in /cms/reset/:token page.
export function renderPasswordResetEmailHTML({ resetURL }: { resetURL: string }): string {
  return renderAccountEmail({
    title: 'Reset your password',
    preheader: 'Reset your LankaNewHomes password.',
    heading: 'Reset your password',
    intro: 'We received a request to reset your LankaNewHomes password. Press the button to choose a new one.',
    buttonLabel: 'Reset password',
    url: resetURL,
    noteTitle: 'Good to know',
    noteLines: ['The link works for one hour and only once.', "If you didn't ask for this, you can safely ignore this email. Your password stays the same."],
  })
}

// Branded HTML for the account emails (verify your email, reset your password) — Payload's own auth.verify /
// auth.forgotPassword send a plain default otherwise. Same visual style as the developer emails
// (src/lib/developer-invite-email.ts): 600px bordered card, square corners, left-aligned wordmark with the
// black "L" mark, orange pill button, beige info box, small footer. Logo is built from HTML (not an image) so it
// shows in every mail app without "load images".
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
  const p = 'margin:0 0 4px; font-size:14px; line-height:1.6; color:#3a3a38;'
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0; padding:0; background-color:#f5f5f0; font-family:Helvetica, Arial, sans-serif;">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0; padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border:1px solid #e4e2db;">
<tr><td style="padding:24px 32px 18px; border-bottom:1px solid #e4e2db;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td width="30" height="30" align="center" valign="middle" style="width:30px; height:30px; background:#111111; color:#ffffff; font-size:17px; font-weight:700; line-height:30px;">L</td>
<td style="padding-left:10px; font-size:20px; color:#1f1f1f; letter-spacing:0.02em;">LankaNewHomes</td>
</tr></table>
</td></tr>
<tr><td style="padding:26px 32px 0;">
<p style="margin:0 0 12px; font-size:22px; color:#1f1f1f; font-weight:400;">${heading}</p>
<p style="margin:0 0 22px; font-size:15px; line-height:1.6; color:#3a3a38;">${intro}</p>
<p style="margin:0 0 22px;"><a href="${url}" style="display:inline-block; background:#f47b36; color:#1f1f1f; text-decoration:none; padding:12px 24px; border-radius:999px; font-size:15px;">${esc(buttonLabel)}</a></p>
</td></tr>
<tr><td style="padding:0 32px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2; border:1px solid #e4e2db;"><tr><td style="padding:16px 20px;">
<p style="margin:0 0 8px; font-size:16px; color:#1f1f1f;">${esc(noteTitle)}</p>
${noteLines.map((line) => `<p style="${p}">&bull; ${line}</p>`).join('')}
</td></tr></table></td></tr>
<tr><td style="padding:14px 32px 0;">
<p style="margin:0; font-size:12px; line-height:1.5; color:#6b6355; word-break:break-all;">Button not working? Paste this link into your browser:<br><a href="${url}" style="color:#6b6355;">${url}</a></p>
${after ?? ''}
</td></tr>
<tr><td style="padding:22px 32px 26px;">
<p style="margin:0; font-size:13px; line-height:1.6; color:#6b6355;">LankaNewHomes &middot; <a href="mailto:support@lankanewhomes.com" style="color:#6b6355;">support@lankanewhomes.com</a></p>
<p style="margin:6px 0 0; font-size:12px; line-height:1.6; color:#9a9282;">This inbox is not monitored. Reply to a message from us or write to support if you need help.</p>
</td></tr>
</table></td></tr></table></body></html>
`
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

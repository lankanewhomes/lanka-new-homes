import { createHash, randomBytes } from 'node:crypto'

// "Verified builder" (owner, 2026-10-04): a company earns the badge by confirming an email address on its own website
// domain (e.g. info@primelands.lk for primelands.lk). See docs/verified-builder.md.

/** Mailbox providers anyone can sign up for — never proof of owning a company domain. */
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.co.in', 'ymail.com', 'outlook.com', 'hotmail.com',
  'hotmail.co.uk', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com', 'proton.me', 'protonmail.com',
  'zoho.com', 'zohomail.com', 'gmx.com', 'gmx.net', 'mail.com', 'yandex.com', 'rediffmail.com', 'inbox.com', 'fastmail.com',
])

export const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000
export const VERIFY_RESEND_COOLDOWN_MS = 60 * 1000

/** "https://www.primelands.lk/about" → "primelands.lk"; null when it isn't a usable website. */
export function websiteDomain(website: unknown): string | null {
  if (typeof website !== 'string' || !website.trim()) return null
  try {
    const url = new URL(/^https?:\/\//i.test(website.trim()) ? website.trim() : `https://${website.trim()}`)
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    return host.includes('.') ? host : null
  } catch {
    return null
  }
}

export function emailDomain(email: string): string {
  return email.trim().toLowerCase().split('@')[1] ?? ''
}

export type DomainCheck = { ok: true; domain: string } | { ok: false; reason: string }

/** The email must be on the company's own website domain (or a subdomain of it), never a free mailbox provider. */
export function checkEmailAgainstWebsite(email: string, website: unknown): DomainCheck {
  const clean = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return { ok: false, reason: 'Enter a valid email address.' }
  const siteDomain = websiteDomain(website)
  if (!siteDomain) return { ok: false, reason: 'Add your company website to your profile first, then verify with an email on that domain.' }
  const mailDomain = emailDomain(clean)
  if (FREE_EMAIL_DOMAINS.has(mailDomain)) return { ok: false, reason: `Use an email on your company's own domain (for example info@${siteDomain}), not a free mailbox like ${mailDomain}.` }
  if (mailDomain !== siteDomain && !mailDomain.endsWith(`.${siteDomain}`)) return { ok: false, reason: `That email is on ${mailDomain}, but your website is ${siteDomain}. Use an address @${siteDomain}.` }
  return { ok: true, domain: siteDomain }
}

export function newVerifyToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('hex')
  return { token, hash: hashToken(token) }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function renderDomainVerificationEmailHTML({ companyName, domain, confirmUrl }: { companyName: string; domain: string; confirmUrl: string }): string {
  const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Confirm your company email</title></head>
<body style="margin:0; padding:0; background-color:#f5f5f0; font-family:Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0; padding:32px 16px;"><tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%; background:#ffffff; border:1px solid #e4e2db;">
      <tr><td style="padding:32px;">
        <p style="margin:0 0 16px; font-size:22px; color:#1f1f1f;">Confirm your company email</p>
        <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#3a3a38;">Confirm that you own an email address at <strong style="font-weight:400;">${esc(domain)}</strong> to add the <strong style="font-weight:400;">Verified builder</strong> badge to ${esc(companyName)} on LankaNewHomes.</p>
        <p style="margin:0 0 24px;"><a href="${esc(confirmUrl)}" style="display:inline-block; background:#f47b36; color:#1f1f1f; text-decoration:none; padding:12px 24px; border-radius:999px; font-size:15px;">Confirm and get verified</a></p>
        <p style="margin:0 0 8px; font-size:13px; line-height:1.6; color:#6b6b68;">This link works once and expires in 24 hours. If you didn't ask for this, you can ignore the email and nothing changes.</p>
        <p style="margin:0; font-size:13px; line-height:1.6; color:#6b6b68; word-break:break-all;">${esc(confirmUrl)}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`
}

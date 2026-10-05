// "Your page is live: register and get Verified" email for developers (owner, 2026-10-05). Pure rendering only:
// nothing here sends mail. scripts/generate-developer-invite-emails.ts builds one per developer into local files.
export type DeveloperInviteInput = {
  name: string
  slug: string
  projects: string[]
  lands: string[]
  phone?: string | null
  email?: string | null
  address?: string | null
  website?: string | null
  /** true when the email on file is on the company's own domain (or an approved extra one): registering with it links and verifies automatically. */
  autoVerify?: boolean
  /** The address buyer enquiries from the site go to, when it is the developer's own (not routed to an agency). */
  leadsEmail?: string | null
  siteUrl?: string
}

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const P = 'margin:0 0 4px; font-size:14px; line-height:1.6; color:#3a3a38;'

export function developerInviteSubject(name: string): string {
  return `Your ${name} page on LankaNewHomes: register and get Verified`
}

export function renderDeveloperInviteHTML(input: DeveloperInviteInput): string {
  const site = input.siteUrl ?? 'https://www.lankanewhomes.com'
  const listed: string[] = []
  if (input.projects.length) listed.push(`${input.projects.length} project${input.projects.length === 1 ? '' : 's'}: ${input.projects.map(esc).join(', ')}`)
  if (input.lands.length) listed.push(`${input.lands.length} land listing${input.lands.length === 1 ? '' : 's'}: ${input.lands.map(esc).join(', ')}`)
  const contact: string[] = []
  if (input.phone) contact.push(`Phone: ${esc(input.phone)}`)
  if (input.email) contact.push(`Email: ${esc(input.email)}`)
  if (input.address) contact.push(`Address: ${esc(input.address)}`)
  if (input.website) contact.push(`Website: ${esc(input.website.replace(/^https?:\/\//, '').replace(/\/$/, ''))}`)
  const box = (title: string, lines: string[], footer = '') => lines.length || footer
    ? `<tr><td style="padding:12px 32px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2; border:1px solid #e4e2db;"><tr><td style="padding:16px 20px;"><p style="margin:0 0 8px; font-size:16px; color:#1f1f1f;">${title}</p>${lines.map((l) => `<p style="${P}">• ${l}</p>`).join('')}${footer}</td></tr></table></td></tr>`
    : ''
  const verifyEmail = input.email ? esc(input.email) : 'an email on your company website domain'
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(developerInviteSubject(input.name))}</title></head>
<body style="margin:0; padding:0; background-color:#f5f5f0; font-family:Helvetica, Arial, sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0; padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border:1px solid #e4e2db;">
<tr><td style="padding:28px 32px 8px; font-size:20px; color:#1f1f1f; letter-spacing:0.02em;">LankaNewHomes</td></tr>
<tr><td style="padding:8px 32px 0;">
<p style="margin:0 0 12px; font-size:22px; color:#1f1f1f; font-weight:400;">Your ${esc(input.name)} page is live. Register and get Verified.</p>
<p style="margin:0 0 16px;"><span style="display:inline-block; background:#ecfeff; border:1px solid #67e8f9; color:#0e7490; border-radius:3px; padding:4px 9px; font-size:11px; letter-spacing:0.06em; text-transform:uppercase;">&#10003; Verified Developer</span></p>
<p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#3a3a38;">Hello ${esc(input.name)} team, we created a free developer page for your company so buyers can find your projects.</p>
<p style="margin:0 0 16px; font-size:14px; line-height:1.6; color:#6b6355;">LankaNewHomes is a free website where buyers in Sri Lanka and abroad browse new homes, apartments and land, with real prices, floor plans and photos, and send enquiries straight to developers.</p>
<p style="margin:0 0 22px;"><a href="${site}/developers/${esc(input.slug)}" style="display:inline-block; border:1px solid #1f1f1f; color:#1f1f1f; text-decoration:none; padding:10px 20px; font-size:14px;">View your page</a></p>
</td></tr>
${box('What we have listed for you', listed)}
${input.leadsEmail ? box('Enquiries', [`Buyer enquiries from the LankaNewHomes website go directly to ${esc(input.leadsEmail)}.`]) : ''}
${box('Contact details we show', contact, `<p style="margin:10px 0 0; font-size:14px; line-height:1.6; color:#6b6355;">Something wrong? Reply to this email or write to <a href="mailto:developers@lankanewhomes.com" style="color:#1f1f1f;">developers@lankanewhomes.com</a> and we will fix it.</p>`)}
<tr><td style="padding:12px 32px 8px;">
<p style="margin:12px 0 10px; font-size:16px; color:#1f1f1f;">Take control of your page (free)</p>
${input.autoVerify
  ? `<p style="${P} margin-bottom:6px;">1. Register your developer account with ${verifyEmail}, the email we have for you.</p>
<p style="${P} margin-bottom:6px;">2. Open the confirmation email we send to that address and confirm it.</p>
<p style="${P} margin-bottom:18px;">3. Log in once. Your account links to this page and the Verified Developer badge turns on automatically.</p>`
  : `<p style="${P} margin-bottom:6px;">1. Register your developer account.</p>
<p style="${P} margin-bottom:6px;">2. Reply to this email so we link it to your ${esc(input.name)} page.</p>
<p style="${P} margin-bottom:6px;">3. In your company profile, open "Verified Developer" and enter an email on your company website domain.</p>
<p style="${P} margin-bottom:18px;">4. Open the link we send you and press Confirm. Your page then shows the Verified Developer badge.</p>`}
<p style="margin:0 0 20px;"><a href="${site}/developers/register" style="display:inline-block; background:#f47b36; color:#1f1f1f; text-decoration:none; padding:12px 24px; border-radius:999px; font-size:15px;">Register my developer account</a></p>
</td></tr>
<tr><td style="padding:0 32px 28px;">
<p style="margin:0; font-size:13px; line-height:1.6; color:#6b6355;">Buyers see that your company identity is confirmed, and you can edit your listings and see enquiries and views.</p>
<p style="margin:14px 0 0; font-size:13px; line-height:1.6; color:#6b6355;">LankaNewHomes · developers@lankanewhomes.com</p>
</td></tr>
</table></td></tr></table></body></html>`
}

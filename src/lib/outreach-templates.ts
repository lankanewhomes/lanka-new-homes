// Email templates for the CMS Outreach log (owner, 2026-10-12). Pure rendering: nothing here sends mail.
// Every link goes through the tracked redirect (/o/<code>?to=/path) so clicks are counted on the Outreach row.
// Wording rule: no pricing or package talk in these emails.

export type OutreachTemplateId = 'listing-update' | 'verify-company' | 'complete-profile' | 'lead-followup'

export type OutreachContext = {
  contactName?: string | null
  companyName?: string | null
  /** Optional paragraph typed in the CMS, shown right after the greeting. */
  customNote?: string | null
  projects: { name: string; slug: string }[]
  /** For the lead-followup template: the enquiry that is still waiting for a reply. */
  lead?: { name: string; email?: string | null; phone?: string | null; preferred?: string | null; message?: string | null; receivedAt?: string | null; projectName: string; planName?: string | null; place?: string | null } | null
  /** Builds the tracked link for a site path such as /developers/login. */
  link: (path: string) => string
}

export const OUTREACH_TEMPLATES: { id: OutreachTemplateId; label: string; description: string }[] = [
  { id: 'listing-update', label: 'Listings updated + verify + complete', description: 'Tells them their listings are updated, then asks them to verify and fill the missing fields.' },
  { id: 'verify-company', label: 'Verify your company', description: 'Short email asking them to get the free Verified Developer badge.' },
  { id: 'lead-followup', label: 'A buyer is waiting (lead follow-up)', description: 'Reminds them of an enquiry that still has no reply, with the buyer\'s details, then asks them to verify and complete their listings.' },
  { id: 'complete-profile', label: 'Complete your listings', description: 'Short email asking them to fill the missing fields for better search placement.' },
]

export const OUTREACH_SENDERS = [
  { value: 'developers@lankanewhomes.com', label: 'developers@ (developer outreach, verification)' },
  { value: 'support@lankanewhomes.com', label: 'support@ (help and questions)' },
] as const

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const INK = '#2b2b29'
const MUTED = '#6b6a66'
const LINE = '#e4e2db'
const PAPER = '#faf7f2'
const ACCENT = '#c2410c'
const P = `margin:0 0 16px; font-size:15px; line-height:1.65; color:${INK};`

const a = (href: string, text: string) => `<a href="${href}" style="color:${ACCENT}; text-decoration:underline;">${esc(text)}</a>`
const button = (href: string, text: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:14px 0 4px;"><tr><td style="background:${ACCENT}; border-radius:4px;"><a href="${href}" style="display:inline-block; padding:11px 22px; font-size:14px; font-weight:700; color:#ffffff; text-decoration:none;">${esc(text)}</a></td></tr></table>`

// A numbered card: a step the developer can act on, with an optional button.
function stepCard(n: number, title: string, lines: string[], cta?: { href: string; text: string }) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px; background:${PAPER}; border:1px solid ${LINE};"><tr>
<td width="52" valign="top" style="padding:18px 0 18px 18px;"><div style="width:30px; height:30px; line-height:30px; border-radius:15px; background:${INK}; color:#ffffff; text-align:center; font-size:14px; font-weight:700;">${n}</div></td>
<td valign="top" style="padding:16px 18px 16px 10px;"><div style="font-size:16px; font-weight:700; color:${INK}; margin:0 0 6px;">${esc(title)}</div>${lines.map((l) => `<div style="font-size:14px; line-height:1.6; color:${INK}; margin:0 0 6px;">${l}</div>`).join('')}${cta ? button(cta.href, cta.text) : ''}</td>
</tr></table>`
}

function verifyStep(ctx: OutreachContext, n: number) {
  return stepCard(n, 'Get the free Verified Developer badge', [
    `Takes about a minute. ${a(ctx.link('/developers/login'), 'Sign in')} (or ${a(ctx.link('/developers/register'), 'create an account')}), open your company profile and confirm an email address on your company domain.`,
    'We email you a one-time link. Click it and the "✓ Verified Developer" badge appears on your profile and on every listing.',
  ], { href: ctx.link('/cms'), text: 'Open my dashboard' })
}

function completeStep(ctx: OutreachContext, n: number) {
  return stepCard(n, 'Fill in the missing fields', [
    'Complete listings rank higher in search and get more buyer enquiries.',
    'Open each project and fill in any empty fields, for example: construction progress, payment plan, nearby places, extra photos, amenities and unit availability.',
    'We can also send you a short list of what is still missing on each listing.',
  ])
}

function projectList(ctx: OutreachContext) {
  if (!ctx.projects.length) return ''
  return `<p style="${P} margin-bottom:8px;"><strong>Your listings</strong></p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px; border-top:1px solid ${LINE};">${ctx.projects
    .map((p) => `<tr><td style="padding:10px 0; border-bottom:1px solid ${LINE}; font-size:15px; color:${INK};">${esc(p.name)}</td><td align="right" style="padding:10px 0; border-bottom:1px solid ${LINE}; font-size:14px;">${a(ctx.link(`/projects/${p.slug}`), 'View listing →')}</td></tr>`)
    .join('')}</table>`
}

function leadBlock(ctx: OutreachContext) {
  const l = ctx.lead
  if (!l) return ''
  const when = l.receivedAt ? new Date(l.receivedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Colombo' }) : ''
  const rows: [string, string][] = [
    ['Name', `<strong>${esc(l.name)}</strong>`],
    ...(l.phone ? [['Phone', esc(l.phone)] as [string, string]] : []),
    ...(l.email ? [['Email', `<a href="mailto:${esc(l.email)}" style="color:${ACCENT};">${esc(l.email)}</a>`] as [string, string]] : []),
    ...(l.preferred ? [['Prefers', esc(l.preferred)] as [string, string]] : []),
    ...(l.message ? [['Message', `“${esc(l.message)}”`] as [string, string]] : []),
    ...(l.place ? [['From', esc(l.place)] as [string, string]] : []),
    ...(when ? [['Received', esc(when)] as [string, string]] : []),
  ]
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px; background:${PAPER}; border:1px solid ${LINE}; border-left:4px solid ${ACCENT};"><tr><td style="padding:16px 18px;">
<div style="font-size:12px; letter-spacing:0.04em; color:${MUTED}; margin:0 0 8px;">BUYER ENQUIRY${l.projectName ? ` · ${esc(l.projectName.toUpperCase())}` : ''}${l.planName ? ` · ${esc(l.planName.toUpperCase())}` : ''}</div>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px; line-height:1.6; color:${INK};">${rows.map(([k, v]) => `<tr><td valign="top" style="padding:2px 14px 2px 0; color:${MUTED}; white-space:nowrap;">${k}</td><td style="padding:2px 0;">${v}</td></tr>`).join('')}</table>
</td></tr></table>`
}

export function outreachSubject(id: OutreachTemplateId, ctx: Pick<OutreachContext, 'companyName' | 'lead'>): string {
  const company = ctx.companyName || 'your company'
  if (id === 'lead-followup') return `A buyer is waiting for a reply about ${ctx.lead?.projectName ?? 'your listing'} on LankaNewHomes`
  if (id === 'verify-company') return `Get the free Verified Developer badge for ${company} on LankaNewHomes`
  if (id === 'complete-profile') return `Complete your ${company} listings on LankaNewHomes to rank higher`
  return `Your ${company} listings are updated on LankaNewHomes, two quick next steps`
}

export function renderOutreachEmail(id: OutreachTemplateId, ctx: OutreachContext): { subject: string; html: string; text: string } {
  const company = esc(ctx.companyName || 'Your company')
  const greeting = `<p style="${P}">Hi ${esc(ctx.contactName?.trim() || 'there')},</p>`
  const note = ctx.customNote?.trim() ? ctx.customNote.trim().split(/\n{2,}/).map((para) => `<p style="${P}">${esc(para).replace(/\n/g, '<br>')}</p>`).join('') : ''
  const l = ctx.lead

  let heading = ''
  let body = ''
  if (id === 'listing-update') {
    heading = 'Your listings are updated'
    body = `${note}<p style="${P}">Your listings on LankaNewHomes have been updated. Two quick things will help buyers trust and find them.</p>${projectList(ctx)}${verifyStep(ctx, 1)}${completeStep(ctx, 2)}`
  } else if (id === 'lead-followup') {
    heading = 'A buyer is waiting for your reply'
    body = `${note}<p style="${P}">A buyer asked about <strong>${esc(l?.projectName ?? 'your listing')}</strong>${l?.planName ? ` (${esc(l.planName)})` : ''} on LankaNewHomes, and we do not see a reply yet. We emailed you this enquiry when it came in. Here it is again:</p>${leadBlock(ctx)}<p style="${P}">Buyers usually contact several developers, so a quick reply helps. You can answer straight from the lead email, or open it in your ${a(ctx.link('/cms'), 'dashboard')} and change its status once you have been in touch.</p><p style="${P} margin-bottom:12px;">While you are there, two quick things help you win more enquiries:</p>${verifyStep(ctx, 1)}${completeStep(ctx, 2)}`
  } else if (id === 'verify-company') {
    heading = 'Get the Verified Developer badge'
    body = `${note}<p style="${P}">${company} is listed on LankaNewHomes. Confirming your company is free and shows buyers they are dealing with the real developer.</p>${projectList(ctx)}${verifyStep(ctx, 1)}`
  } else {
    heading = 'Complete your listings'
    body = `${note}<p style="${P}">${company} is listed on LankaNewHomes. A few details are still missing, and filling them in helps your listings show up higher in search.</p>${projectList(ctx)}${completeStep(ctx, 1)}`
  }

  const header = `<tr><td style="padding:22px 32px 18px; border-bottom:3px solid ${ACCENT};"><a href="https://www.lankanewhomes.com" style="text-decoration:none;"><img src="https://www.lankanewhomes.com/brand/logo-email.png" width="130" alt="LankaNewHomes" style="display:block; border:0; width:130px; height:auto; font-size:18px; font-weight:700; color:#1f1f1f;"></a></td></tr>`
  const title = `<tr><td style="padding:26px 32px 4px;"><div style="font-size:22px; line-height:1.3; font-weight:700; color:${INK};">${esc(heading)}</div></td></tr>`
  const main = `<tr><td style="padding:14px 32px 8px;">${greeting}${body}<p style="${P}">Let me know if you would like any changes.</p><p style="${P} margin-bottom:4px;">Best regards,<br><strong>Rupan</strong><br><span style="color:${MUTED};">LankaNewHomes</span></p></td></tr>`
  const footer = `<tr><td style="padding:18px 32px 26px; border-top:1px solid ${LINE}; font-size:12px; line-height:1.6; color:${MUTED};">LankaNewHomes · New homes and land for sale in Sri Lanka<br>Questions? Just reply to this email or write to ${a('mailto:developers@lankanewhomes.com', 'developers@lankanewhomes.com')}.</td></tr>`
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0; padding:24px 12px; background:#f3f1ec; font-family:Arial,Helvetica,sans-serif;"><table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; margin:0 auto; background:#ffffff; border:1px solid ${LINE};">${header}${title}${main}${footer}</table></body></html>`
  const text = html
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g, '$2 ($1)')
    .replace(/<\/(p|li|ul|tr|div|table)>/g, '\n')
    .replace(/<br>/g, '\n')
    .replace(/<\/td>/g, '  ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return { subject: outreachSubject(id, ctx), html, text }
}

/** A short personal reply in the same branded shell (logo, rule, signature, footer) with no steps or buttons. Paragraphs are separated by blank lines. */
export function renderPlainReplyEmail(opts: { body: string; signoff?: string }): { html: string; text: string } {
  const paras = opts.body.trim().split(/\n{2,}/).map((para) => `<p style="${P}">${esc(para).replace(/\n/g, '<br>')}</p>`).join('')
  const header = `<tr><td style="padding:22px 32px 18px; border-bottom:3px solid ${ACCENT};"><a href="https://www.lankanewhomes.com" style="text-decoration:none;"><img src="https://www.lankanewhomes.com/brand/logo-email.png" width="130" alt="LankaNewHomes" style="display:block; border:0; width:130px; height:auto; font-size:18px; font-weight:700; color:#1f1f1f;"></a></td></tr>`
  const main = `<tr><td style="padding:26px 32px 8px;">${paras}<p style="${P} margin-bottom:4px;">${esc(opts.signoff ?? 'Best regards,')}<br><strong>Rupan</strong><br><span style="color:${MUTED};">LankaNewHomes</span></p></td></tr>`
  const footer = `<tr><td style="padding:18px 32px 26px; border-top:1px solid ${LINE}; font-size:12px; line-height:1.6; color:${MUTED};">LankaNewHomes · New homes and land for sale in Sri Lanka<br>Questions? Just reply to this email or write to ${a('mailto:developers@lankanewhomes.com', 'developers@lankanewhomes.com')}.</td></tr>`
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0; padding:24px 12px; background:#f3f1ec; font-family:Arial,Helvetica,sans-serif;"><table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; margin:0 auto; background:#ffffff; border:1px solid ${LINE};">${header}${main}${footer}</table></body></html>`
  const text = `${opts.body.trim()}\n\n${opts.signoff ?? 'Best regards,'}\nRupan\nLankaNewHomes`
  return { html, text }
}

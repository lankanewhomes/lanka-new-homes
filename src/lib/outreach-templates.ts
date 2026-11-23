import { darkBg, emailHero, emailShell, lightOnDark, verifiedPill } from './email-layout'
// Email templates for the CMS Outreach log (owner, 2026-10-12). Pure rendering: nothing here sends mail.
// Every link goes through the tracked redirect (/o/<code>?to=/path) so clicks are counted on the Outreach row.
// Wording rule: no pricing or package talk in these emails.

export type OutreachTemplateId = 'listing-update' | 'verify-company' | 'complete-profile' | 'lead-followup'

export type OutreachContext = {
  contactName?: string | null
  companyName?: string | null
  /** Optional paragraph typed in the CMS, shown right after the greeting. */
  customNote?: string | null
  /** Name in the sign-off. Only pass a person's name (e.g. Rupan Sinnarajah) when the email goes from that person's own address; otherwise it reads "LankaNewHomes Team". */
  signName?: string | null
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
const INK = '#1c1c20'
const TEXT = '#2b2b29'
const MUTED = '#6b6a66'
const LINE = '#e4e2db'
const PAPER = '#faf7f2'
const ORANGE = '#f47b36'
const P = `margin:0 0 16px; font-size:15px; line-height:1.65; color:${TEXT};`

// Same pieces as the shared layout (src/lib/email-layout.ts), so these emails match every other one (owner, 2026-11-23: "be consistent
// with the design ... for all of them"): dark ink links, the square orange button with dark text, the dark square number tile.
const a = (href: string, text: string) => `<a href="${href}" style="color:${INK}; font-weight:700; text-decoration:underline;">${esc(text)}</a>`
const button = (href: string, text: string) =>
  `<div style="margin:16px 0 4px;"><a href="${href}" style="display:inline-block; background:${ORANGE}; color:${INK}; text-decoration:none; font-size:15px; font-weight:700; padding:13px 24px;">${esc(text)}</a></div>`

// A numbered card: a step the developer can act on, with an optional button. The number tile sits beside the title only and the text runs
// the full width of the card underneath, so it stays readable on a phone (a number column down the whole card squeezed the text).
function stepCard(n: number, title: string, lines: string[], cta?: { href: string; text: string }) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px; background:#ffffff; border:1px solid ${LINE};">
<tr><td width="44" valign="middle" style="${darkBg()} width:44px; color:#ffffff; text-align:center; font-size:17px; font-weight:700; padding:12px 0;">${lightOnDark(String(n))}</td>
<td valign="middle" style="padding:10px 16px; font-size:16px; font-weight:700; line-height:1.3; color:${INK}; border-bottom:1px solid ${LINE};">${esc(title)}</td></tr>
<tr><td colspan="2" style="padding:14px 16px 16px;">${lines.map((l) => `<div style="font-size:14px; line-height:1.6; color:${TEXT}; margin:0 0 8px;">${l}</div>`).join('')}${cta ? button(cta.href, cta.text) : ''}</td></tr>
</table>`
}

function verifyStep(ctx: OutreachContext, n: number) {
  return stepCard(n, 'Get the free Verified Developer badge', [
    verifiedPill(),
    `Takes about a minute. ${a(ctx.link('/developers/login'), 'Sign in')} (or ${a(ctx.link('/developers/register'), 'create an account')}), open your company profile and confirm an email address on your company domain.`,
    'We email you a one-time link. Click it and the "✓ Verified Developer" badge appears on your profile and on every listing.',
  ], { href: ctx.link('/developers/dashboard'), text: 'Open my dashboard' })
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
  return `<div style="margin:6px 0 8px; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${ORANGE};">Your listings</div>${ctx.projects
    .map((p) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px; border:1px solid ${LINE}; border-left:4px solid ${ORANGE}; background:#ffffff;"><tr><td style="padding:14px 16px;"><span style="font-size:16px; font-weight:700; line-height:1.3; color:${INK};">${esc(p.name)}</span><div style="margin:8px 0 0; font-size:13px;">${a(ctx.link(`/projects/${p.slug}`), 'View listing →')}</div></td></tr></table>`)
    .join('')}<div style="height:10px; line-height:10px; font-size:0;">&nbsp;</div>`
}

function leadBlock(ctx: OutreachContext) {
  const l = ctx.lead
  if (!l) return ''
  const when = l.receivedAt ? new Date(l.receivedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Colombo' }) : ''
  const rows: [string, string][] = [
    ['Name', `<strong>${esc(l.name)}</strong>`],
    ...(l.phone ? [['Phone', esc(l.phone)] as [string, string]] : []),
    ...(l.email ? [['Email', `<a href="mailto:${esc(l.email)}" style="color:${INK};">${esc(l.email)}</a>`] as [string, string]] : []),
    ...(l.preferred ? [['Prefers', esc(l.preferred)] as [string, string]] : []),
    ...(l.message ? [['Message', `“${esc(l.message)}”`] as [string, string]] : []),
    ...(l.place ? [['From', esc(l.place)] as [string, string]] : []),
    ...(when ? [['Received', esc(when)] as [string, string]] : []),
  ]
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px; background:${PAPER}; border:1px solid ${LINE}; border-left:4px solid ${ORANGE};"><tr><td style="padding:16px 18px;">
<div style="font-size:12px; font-weight:700; letter-spacing:0.08em; color:${MUTED}; margin:0 0 8px;">BUYER ENQUIRY${l.projectName ? ` · ${esc(l.projectName.toUpperCase())}` : ''}${l.planName ? ` · ${esc(l.planName.toUpperCase())}` : ''}</div>
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
    body = `${note}<p style="${P}">A buyer asked about <strong>${esc(l?.projectName ?? 'your listing')}</strong>${l?.planName ? ` (${esc(l.planName)})` : ''} on LankaNewHomes, and we do not see a reply yet. We emailed you this enquiry when it came in. Here it is again:</p>${leadBlock(ctx)}<p style="${P}">Buyers usually contact several developers, so a quick reply helps. You can answer straight from the lead email, or open it in your ${a(ctx.link('/developers/dashboard'), 'dashboard')} and change its status once you have been in touch.</p><p style="${P} margin-bottom:12px;">While you are there, two quick things help you win more enquiries:</p>${verifyStep(ctx, 1)}${completeStep(ctx, 2)}`
  } else if (id === 'verify-company') {
    heading = 'Get the Verified Developer badge'
    body = `${note}<p style="${P}">${company} is listed on LankaNewHomes. Confirming your company is free and shows buyers they are dealing with the real developer.</p>${projectList(ctx)}${verifyStep(ctx, 1)}`
  } else {
    heading = 'Complete your listings'
    body = `${note}<p style="${P}">${company} is listed on LankaNewHomes. A few details are still missing, and filling them in helps your listings show up higher in search.</p>${projectList(ctx)}${completeStep(ctx, 1)}`
  }

  const title = emailHero(esc(heading))
  const main = `<tr><td style="padding:14px 32px 30px;">${greeting}${body}<p style="${P}">Let me know if you would like any changes.</p><p style="${P} margin-bottom:4px;">Warm regards,<br><strong>${esc(ctx.signName ?? 'LankaNewHomes Team')}</strong></p></td></tr>`
  const html = emailShell({ preheader: heading, title: heading, body: `${title}${main}`, helpNote: `Questions? Just reply to this email or write to ${a('mailto:developers@lankanewhomes.com', 'developers@lankanewhomes.com')}.` })
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
export function renderPlainReplyEmail(opts: { body: string; signoff?: string; signName?: string; button?: { href: string; text: string } }): { html: string; text: string } {
  const paras = opts.body.trim().split(/\n{2,}/).map((para) => `<p style="${P}">${esc(para).replace(/\n/g, '<br>')}</p>`).join('')
  const main = `<tr><td style="padding:26px 32px 30px;">${paras}${opts.button ? button(opts.button.href, opts.button.text) : ''}<p style="${P} margin:18px 0 4px;">${esc(opts.signoff ?? 'Warm regards,')}<br><strong>${esc(opts.signName ?? 'LankaNewHomes Team')}</strong><br><span style="color:${MUTED};">LankaNewHomes</span></p></td></tr>`
  const html = emailShell({ preheader: 'A message from LankaNewHomes', title: 'LankaNewHomes', body: main, helpNote: `Questions? Just reply to this email or write to ${a('mailto:developers@lankanewhomes.com', 'developers@lankanewhomes.com')}.` })
  const text = `${opts.body.trim()}${opts.button ? `\n\n${opts.button.text}: ${opts.button.href}` : ''}\n\n${opts.signoff ?? 'Warm regards,'}\n${opts.signName ?? 'LankaNewHomes Team'}\nLankaNewHomes`
  return { html, text }
}

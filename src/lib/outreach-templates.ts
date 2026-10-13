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
const P = 'margin:0 0 14px; font-size:15px; line-height:1.6; color:#2b2b29;'
const A = 'color:#c2410c; text-decoration:underline;'
const H = 'margin:20px 0 6px; font-size:15px; line-height:1.4; color:#2b2b29;'

const a = (href: string, text: string) => `<a href="${href}" style="${A}">${esc(text)}</a>`
const ul = (items: string[]) => `<ul style="margin:0 0 14px; padding-left:22px; font-size:15px; line-height:1.6; color:#2b2b29;">${items.map((i) => `<li style="margin:0 0 4px;">${i}</li>`).join('')}</ul>`

function verifyBlock(ctx: OutreachContext) {
  return [
    `<p style="${H}"><strong>Get the free Verified Developer badge (about a minute)</strong></p>`,
    ul([
      `${a(ctx.link('/developers/login'), 'Sign in to your LankaNewHomes account')} (or ${a(ctx.link('/developers/register'), 'create one')} if you do not have it yet).`,
      `Open your company profile in the ${a(ctx.link('/cms'), 'dashboard')} and use the "Verified Developer" panel to confirm an email address on your company domain.`,
      'We email you a one-time link. Click it and the "✓ Verified Developer" badge appears on your profile and on every listing.',
    ]),
  ].join('')
}

function completeBlock(ctx: OutreachContext) {
  return [
    `<p style="${H}"><strong>Fill in the missing fields</strong></p>`,
    ul([
      'Complete listings rank higher in search and get more buyer enquiries.',
      `Open each project in the ${a(ctx.link('/cms'), 'dashboard')} and fill in any empty fields, for example: construction progress, payment plan, nearby places, extra photos, amenities and unit availability.`,
      'We can also send you a short list of what is still missing on each listing.',
    ]),
  ].join('')
}

function leadBlock(ctx: OutreachContext) {
  const l = ctx.lead
  if (!l) return ''
  const when = l.receivedAt ? new Date(l.receivedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Colombo' }) : ''
  const rows: [string, string][] = [
    ['Name', esc(l.name)],
    ...(l.phone ? [['Phone', esc(l.phone)] as [string, string]] : []),
    ...(l.email ? [['Email', `<a href="mailto:${esc(l.email)}" style="${A}">${esc(l.email)}</a>`] as [string, string]] : []),
    ...(l.preferred ? [['Prefers', esc(l.preferred)] as [string, string]] : []),
    ...(l.message ? [['Message', esc(l.message)] as [string, string]] : []),
    ...(l.place ? [['From', esc(l.place)] as [string, string]] : []),
    ...(when ? [['Received', esc(when)] as [string, string]] : []),
  ]
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px; border:1px solid #e4e2db; background:#faf7f2; width:100%;"><tr><td style="padding:14px 16px; font-size:15px; line-height:1.7; color:#2b2b29;">${rows.map(([k, v]) => `<strong>${k}:</strong> ${v}`).join('<br>')}</td></tr></table>`
}

function projectList(ctx: OutreachContext) {
  if (!ctx.projects.length) return ''
  return `<p style="${P}">Your listings:</p>${ul(ctx.projects.map((p) => a(ctx.link(`/projects/${p.slug}`), p.name)))}`
}

export function outreachSubject(id: OutreachTemplateId, ctx: Pick<OutreachContext, 'companyName' | 'lead'>): string {
  const company = ctx.companyName || 'your company'
  if (id === 'lead-followup') return `A buyer is waiting for a reply about ${ctx.lead?.projectName ?? 'your listing'} on LankaNewHomes`
  if (id === 'verify-company') return `Get the free Verified Developer badge for ${company} on LankaNewHomes`
  if (id === 'complete-profile') return `Complete your ${company} listings on LankaNewHomes to rank higher`
  return `Your ${company} listings are updated on LankaNewHomes, two quick next steps`
}

export function renderOutreachEmail(id: OutreachTemplateId, ctx: OutreachContext): { subject: string; html: string; text: string } {
  const greeting = `<p style="${P}">Hi ${esc(ctx.contactName?.trim() || 'there')},</p>`
  const note = ctx.customNote?.trim() ? ctx.customNote.trim().split(/\n{2,}/).map((para) => `<p style="${P}">${esc(para).replace(/\n/g, '<br>')}</p>`).join('') : ''
  const closing = `<p style="${P}">Let me know if you would like any changes.</p><p style="${P}">Best regards,<br>Rupan<br>LankaNewHomes<br>${a('mailto:developers@lankanewhomes.com', 'developers@lankanewhomes.com')}</p>`

  let body = ''
  if (id === 'listing-update') {
    body = `${note}<p style="${P}">Your listings on LankaNewHomes have been updated.</p>${projectList(ctx)}<p style="${P}">Two quick next steps:</p>${verifyBlock(ctx)}${completeBlock(ctx)}`
  } else if (id === 'lead-followup') {
    const l = ctx.lead
    body = `${note}<p style="${P}">A buyer asked about <strong>${esc(l?.projectName ?? 'your listing')}</strong>${l?.planName ? ` (${esc(l.planName)})` : ''} on LankaNewHomes, and we do not see a reply yet. We emailed you this enquiry when it came in. Here it is again:</p>${leadBlock(ctx)}<p style="${P}">Buyers usually contact several developers, so a quick reply helps. You can answer straight from the lead email, or open it in your ${a(ctx.link('/cms'), 'dashboard')} and change its status once you have been in touch.</p><p style="${P}">While you are there, two quick things that help you win more enquiries:</p>${verifyBlock(ctx)}${completeBlock(ctx)}`
  } else if (id === 'verify-company') {
    body = `${note}<p style="${P}">${esc(ctx.companyName || 'Your company')} is listed on LankaNewHomes. Confirming your company takes about a minute and is free.</p>${projectList(ctx)}${verifyBlock(ctx)}`
  } else {
    body = `${note}<p style="${P}">${esc(ctx.companyName || 'Your company')} is listed on LankaNewHomes. A few details are still missing, and filling them in helps your listings show up higher in search.</p>${projectList(ctx)}${completeBlock(ctx)}`
  }

  const html = `<!doctype html><html><body style="margin:0; padding:24px; background:#ffffff; font-family:Arial,Helvetica,sans-serif;"><div style="max-width:620px;">${greeting}${body}${closing}</div></body></html>`
  const text = html
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g, '$2 ($1)')
    .replace(/<\/(p|li|ul)>/g, '\n')
    .replace(/<br>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return { subject: outreachSubject(id, ctx), html, text }
}

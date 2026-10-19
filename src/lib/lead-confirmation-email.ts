import { WHATSAPP_BUTTON, emailButtonRow, emailFacts, emailHero, emailPara, emailShell, esc } from './email-layout'

// "We've sent your request to <developer>" — the buyer's copy, sent the
// moment a lead is created (src/lib/lead-alerts.ts). Same visual style as
// the alert/brochure emails. Gives the buyer the developer's direct
// contacts so they can follow up themselves, and a link to My enquiries.

export type LeadConfirmationEmailInput = {
  buyerName: string
  projectName: string
  planName?: string | null
  projectUrl: string
  developerName: string
  developerPhone?: string | null
  developerEmail?: string | null
  /** wa.me link to the developer with an opener; null when they have no WhatsApp. */
  developerWhatsAppHref?: string | null
  preferredContact?: string | null
  buyerPhone?: string | null
  buyerEmail?: string | null
  message?: string | null
  enquiriesUrl: string
}

const INK = '#1c1c20'

export function renderLeadConfirmationEmailHTML(input: LeadConfirmationEmailInput): string {
  const what = input.planName ? `${esc(input.planName)} at ${esc(input.projectName)}` : esc(input.projectName)
  const developer = esc(input.developerName)
  const phoneDigits = input.developerPhone ? input.developerPhone.split(/\s*\/\s*/)[0].replace(/[^+\d]/g, '') : ''
  // "on WhatsApp on 077 …", "by email at you@…", "by phone on 077 …".
  const preferred = (input.preferredContact ?? '').trim().toLowerCase()
  const channel = preferred === 'whatsapp' ? 'on WhatsApp' : preferred === 'email' ? 'by email' : preferred === 'text' ? 'by text message' : preferred === 'phone' ? 'by phone' : ''
  const where = preferred === 'email' ? (input.buyerEmail ? ` at ${esc(input.buyerEmail)}` : '') : input.buyerPhone ? ` on ${esc(input.buyerPhone)}` : ''
  const reachYou = channel ? `${channel}${where}` : input.buyerPhone ? `on ${esc(input.buyerPhone)}` : ''
  const buttons = [
    input.developerWhatsAppHref ? { label: `WhatsApp ${developer}`, href: input.developerWhatsAppHref, ...WHATSAPP_BUTTON } : null,
    phoneDigits ? { label: 'Call them', href: `tel:${phoneDigits}`, bg: INK, fg: '#ffffff' } : null,
    { label: 'View the listing', href: input.projectUrl },
  ].filter((b): b is { label: string; href: string; bg?: string; fg?: string } => b !== null)
  const facts: [string, string][] = [
    ['Developer', developer],
    ['Phone', input.developerPhone ? esc(input.developerPhone) : ''],
    ['Email', input.developerEmail ? `<a href="mailto:${esc(input.developerEmail)}" style="color:${INK};">${esc(input.developerEmail)}</a>` : ''],
    ['Your message', input.message ? esc(input.message).replace(/\n/g, '<br>') : ''],
  ]
  const body = [
    emailHero(`Your request was sent to ${developer}.`, `Thanks for asking about ${what}.`),
    emailPara(`Hi ${esc(input.buyerName)}, ${developer} has your details${reachYou ? ` and will get back to you ${reachYou}` : ''}.`),
    emailFacts(facts),
    emailButtonRow(buttons),
    `  <tr><td align="center" style="padding:14px 32px 26px;font-size:13px;line-height:1.6;color:#6b6a66;">You can follow this and every request you have made under <a href="${esc(input.enquiriesUrl)}" style="color:${INK};font-weight:700;">My enquiries</a>. Replying to this email reaches ${developer} directly.</td></tr>`,
  ].join('\n')
  return emailShell({ preheader: `Your request about ${input.projectName} was sent to ${input.developerName}.`, title: 'Your request was sent', body, footerNote: 'You are receiving this because you sent an enquiry on LankaNewHomes.' })
}

import { WHATSAPP_BUTTON, emailButtonRow, emailFacts, emailHero, emailPanel, emailShell, esc } from './email-layout'

// The instant "new lead" alert sent to a developer. Restyled 2026-10-18 (owner: "let's be consistent with the design of the emails") to the
// shared email layout (src/lib/email-layout.ts): dark logo header with the orange rule, the buyer's details in a card, one-tap reply buttons
// (WhatsApp in green, Call and Email in dark), and the dashboard link. Content and reply links are unchanged.

export type LeadAlertEmailInput = {
  projectName: string
  planName?: string | null
  sourceLabel: string
  buyerName: string
  buyerPhone?: string | null
  buyerEmail?: string | null
  preferredContact?: string | null
  message?: string | null
  receivedAt: Date
  /** Set for a brochure request: whether we had a brochure to email the buyer. Drives the banner and the plain-language line. */
  brochure?: { requested: boolean; sent: boolean } | null
  projectUrl?: string | null
  /** Signed one-tap links (src/lib/lead-reply-links.ts): tapping one marks the lead answered and forwards to WhatsApp / the dialer / mail.
   * Null when the buyer left no number / address for that channel. */
  replyLinks: { whatsapp: string | null; call: string | null; email: string | null }
  dashboardUrl: string
}

const INK = '#1c1c20'

export function renderLeadAlertEmailHTML(input: LeadAlertEmailInput): string {
  const what = input.planName ? `${esc(input.planName)} · ${esc(input.projectName)}` : esc(input.projectName)
  const { replyLinks } = input
  const when = input.receivedAt.toLocaleString('en-GB', { timeZone: 'Asia/Colombo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const asked = input.brochure?.requested
    ? input.brochure.sent
      ? `${esc(input.buyerName)} asked for the <strong>brochure</strong> of ${what}. We emailed them the brochure we hold on LankaNewHomes. Please follow up with them.`
      : `${esc(input.buyerName)} asked for the <strong>brochure</strong> of ${what}. <strong>We do not have a brochure for this listing, so none was sent.</strong> Please send it to them directly using the details below.`
    : ''
  const buttons = [
    replyLinks.whatsapp ? { label: 'Reply on WhatsApp', href: replyLinks.whatsapp, ...WHATSAPP_BUTTON } : null,
    replyLinks.call ? { label: 'Call', href: replyLinks.call, bg: INK, fg: '#ffffff' } : null,
    replyLinks.email ? { label: 'Email', href: replyLinks.email, bg: INK, fg: '#ffffff' } : null,
  ].filter((b): b is { label: string; href: string; bg: string; fg: string } => b !== null)
  const facts: [string, string][] = [
    ['Requested', input.brochure?.requested ? 'The brochure' : ''],
    ['Name', esc(input.buyerName)],
    ['Phone', input.buyerPhone ? (replyLinks.call ? `<a href="${esc(replyLinks.call)}" style="color:${INK};">${esc(input.buyerPhone)}</a>` : esc(input.buyerPhone)) : ''],
    ['Email', input.buyerEmail ? (replyLinks.email ? `<a href="${esc(replyLinks.email)}" style="color:${INK};">${esc(input.buyerEmail)}</a>` : esc(input.buyerEmail)) : ''],
    ['Prefers', input.preferredContact ? esc(input.preferredContact) : ''],
    ['Floor plan', input.planName ? esc(input.planName) : ''],
    ['Listing', input.projectUrl ? `<a href="${esc(input.projectUrl)}" style="color:${INK};">${esc(input.projectUrl.replace(/^https?:\/\//, ''))}</a>` : ''],
    ['Message', input.message ? `“${esc(input.message).replace(/\n/g, '<br>')}”` : ''],
    ['Received', `${esc(when)} (Sri Lanka time)`],
  ]
  const body = [
    emailHero(`You have a new lead.`, `${esc(input.sourceLabel)} on ${what}`),
    asked ? emailPanel({ heading: input.brochure?.sent ? 'Brochure requested' : 'Brochure requested: please send it', bodyHtml: asked, tint: '#fff7ed' }) : '',
    emailFacts(facts),
    buttons.length ? emailButtonRow(buttons) : '',
    buttons.length ? `  <tr><td align="center" style="padding:0 32px 4px;font-size:12px;color:#6b6a66;">Tapping a reply button marks this lead as contacted for you.</td></tr>` : '',
    `  <tr><td align="center" style="padding:14px 32px 6px;"><a href="${esc(input.dashboardUrl)}" style="font-size:14px;font-weight:700;color:${INK};text-decoration:underline;">Open this lead in your dashboard</a></td></tr>`,
    `  <tr><td style="padding:14px 32px 26px;font-size:13px;line-height:1.6;color:#6b6a66;">Buyers usually go with the first developer who answers. Your reply time shows on your LankaNewHomes profile.</td></tr>`,
  ].filter(Boolean).join('\n')
  return emailShell({ preheader: `${input.buyerName} asked about ${input.projectName}${input.buyerPhone ? `: ${input.buyerPhone}` : ''}.`, title: `New lead: ${input.projectName}`, body })
}

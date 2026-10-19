import { emailButton, emailFacts, emailHero, emailShell, esc } from './email-layout'

// Internal "you got a lead" notice for the LankaNewHomes owner (2026-10-18: "i dont need a copy of the email, i need an email that says i got a
// lead"). A short summary: who asked, about which listing, which developer it was sent to, and a link to the lead. Sent from no-reply@ to the
// owner's mailbox (LEAD_NOTICE_TO, default developers@lankanewhomes.com). Live leads only, never in test mode.

export type LeadNoticeInput = {
  buyerName: string
  buyerPhone?: string | null
  buyerEmail?: string | null
  preferredContact?: string | null
  message?: string | null
  sourceLabel: string
  projectName: string
  planName?: string | null
  projectUrl: string
  developerName: string
  sentTo: string[]
  brochure?: { requested: boolean; sent: boolean } | null
  receivedAt: Date
  dashboardUrl: string
}

export function leadNoticeSubject(i: LeadNoticeInput): string {
  return `You got a lead: ${i.buyerName} · ${i.planName ? `${i.planName}, ` : ''}${i.projectName} (${i.developerName})`
}

export function renderLeadNoticeHTML(i: LeadNoticeInput): string {
  const when = i.receivedAt.toLocaleString('en-CA', { timeZone: 'America/Toronto', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
  const rows: [string, string][] = [
    ['Buyer', esc(i.buyerName)],
    ['Phone', i.buyerPhone ? esc(i.buyerPhone) : ''],
    ['Email', i.buyerEmail ? esc(i.buyerEmail) : ''],
    ['Prefers', i.preferredContact ? esc(i.preferredContact) : ''],
    ['Message', i.message ? `\u201c${esc(i.message)}\u201d` : ''],
    ['Asked about', `<a href="${esc(i.projectUrl)}" style="color:#1c1c20;">${esc(i.planName ? `${i.planName} at ${i.projectName}` : i.projectName)}</a>`],
    ['Type', esc(i.sourceLabel)],
    ['Brochure', i.brochure?.requested ? (i.brochure.sent ? 'We emailed it to the buyer' : 'None on file, developer asked to send it') : ''],
    ['Developer', esc(i.developerName)],
    ['Alert sent to', esc(i.sentTo.join(', ') || 'no address on file')],
    ['Received', esc(when)],
  ]
  const body = [
    emailHero(`You got a lead: ${esc(i.buyerName)}.`, `${esc(i.sourceLabel)} on ${esc(i.projectName)}, for ${esc(i.developerName)}.`),
    emailFacts(rows),
    emailButton('Open the lead in the dashboard', i.dashboardUrl),
    '  <tr><td style="padding:8px 32px 28px;font-size:13px;color:#6b6a66;">This is a notice for you. The developer has already been emailed the full details.</td></tr>',
  ].join('\n')
  return emailShell({ preheader: `${i.buyerName} asked about ${i.projectName}. Sent to ${i.developerName}.`, title: 'You got a lead', body, footerNote: 'Internal notice from LankaNewHomes. Sent for every live lead.' })
}

import { WHATSAPP_BUTTON, emailButtonRow, emailFacts, emailHero, emailShell, esc } from './email-layout'

// Reminder to a developer whose buyer enquiry is still "New" (no reply button tapped, status not moved). Same layout as the instant alert
// (src/lib/lead-alert-email.ts): the buyer's details and the same signed one-tap reply links, so answering marks the lead as contacted.

export type LeadReminderEmailInput = {
  /** 1 = first reminder, 2 = last reminder. */
  number: number
  hoursWaiting: number
  projectName: string
  planName?: string | null
  buyerName: string
  buyerPhone?: string | null
  buyerEmail?: string | null
  preferredContact?: string | null
  message?: string | null
  receivedAt: Date
  replyLinks: { whatsapp: string | null; call: string | null; email: string | null }
  dashboardUrl: string
}

const INK = '#1c1c20'

export function leadReminderSubject(i: Pick<LeadReminderEmailInput, 'number' | 'buyerName' | 'projectName' | 'planName'>): string {
  return `${i.number > 1 ? 'Last reminder' : 'Reminder'}: ${i.buyerName} is still waiting for a reply · ${i.planName ? `${i.planName}, ` : ''}${i.projectName}`
}

export function renderLeadReminderEmailHTML(i: LeadReminderEmailInput): string {
  const what = i.planName ? `${esc(i.planName)} · ${esc(i.projectName)}` : esc(i.projectName)
  const when = i.receivedAt.toLocaleString('en-GB', { timeZone: 'Asia/Colombo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const waiting = i.hoursWaiting >= 48 ? `${Math.round(i.hoursWaiting / 24)} days` : `${Math.max(1, Math.round(i.hoursWaiting))} hours`
  const { replyLinks } = i
  const buttons = [
    replyLinks.whatsapp ? { label: 'Reply on WhatsApp', href: replyLinks.whatsapp, ...WHATSAPP_BUTTON } : null,
    replyLinks.call ? { label: 'Call', href: replyLinks.call, bg: INK, fg: '#ffffff' } : null,
    replyLinks.email ? { label: 'Email', href: replyLinks.email, bg: INK, fg: '#ffffff' } : null,
  ].filter((b): b is { label: string; href: string; bg: string; fg: string } => b !== null)
  const facts: [string, string][] = [
    ['Name', esc(i.buyerName)],
    ['Phone', i.buyerPhone ? (replyLinks.call ? `<a href="${esc(replyLinks.call)}" style="color:${INK};">${esc(i.buyerPhone)}</a>` : esc(i.buyerPhone)) : ''],
    ['Email', i.buyerEmail ? (replyLinks.email ? `<a href="${esc(replyLinks.email)}" style="color:${INK};">${esc(i.buyerEmail)}</a>` : esc(i.buyerEmail)) : ''],
    ['Prefers', i.preferredContact ? esc(i.preferredContact) : ''],
    ['Asked about', what],
    ['Message', i.message ? `“${esc(i.message).replace(/\n/g, '<br>')}”` : ''],
    ['Received', `${esc(when)} (Sri Lanka time)`],
  ]
  const body = [
    emailHero(`${esc(i.buyerName)} is still waiting for a reply.`, `Their enquiry about ${what} came in ${esc(waiting)} ago and is still marked New.`),
    emailFacts(facts),
    buttons.length ? emailButtonRow(buttons) : '',
    buttons.length ? `  <tr><td align="center" style="padding:0 32px 4px;font-size:12px;color:#6b6a66;">Tapping a reply button marks this lead as contacted for you.</td></tr>` : '',
    `  <tr><td align="center" style="padding:14px 32px 6px;"><a href="${esc(i.dashboardUrl)}" style="font-size:14px;font-weight:700;color:${INK};text-decoration:underline;">Open this lead in your dashboard</a></td></tr>`,
    `  <tr><td style="padding:14px 32px 26px;font-size:13px;line-height:1.6;color:#6b6a66;">Buyers usually go with the first developer who answers, and your reply time shows on your LankaNewHomes profile. If you have already been in touch, tap Reply on WhatsApp, Call or Email once, or change the lead to Contacted in your dashboard, and these reminders stop.</td></tr>`,
  ].filter(Boolean).join('\n')
  return emailShell({ preheader: `${i.buyerName} asked about ${i.projectName} and has not had a reply yet.`, title: `Reminder: ${i.projectName}`, body })
}

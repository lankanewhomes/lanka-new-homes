// Branded HTML for the instant "new lead" alert sent to a developer — same
// visual style as the brochure and verification emails, with the buyer's
// details and one-tap reply buttons (WhatsApp / call / email) up top.

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
  /** Signed one-tap links (src/lib/lead-reply-links.ts) — tapping one marks
   * the lead answered and forwards to WhatsApp / the dialer / mail. Null
   * when the buyer left no number / address for that channel. */
  replyLinks: { whatsapp: string | null; call: string | null; email: string | null }
  dashboardUrl: string
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const INK = '#2b2b29'
const MUTED = '#6b6a66'
const LINE = '#e4e2db'
const PAPER = '#faf7f2'
const ACCENT = '#c2410c'

function button(href: string, label: string, bg: string): string {
  return `<td style="padding:0 8px 8px 0;"><a href="${href}" style="display:inline-block; padding:12px 22px; font-size:14px; font-weight:700; color:#ffffff; background-color:${bg}; text-decoration:none; border-radius:4px;">${label}</a></td>`
}

function row(label: string, value: string): string {
  return `<tr><td valign="top" style="padding:3px 16px 3px 0; font-size:14px; color:${MUTED}; white-space:nowrap;">${label}</td><td valign="top" style="padding:3px 0; font-size:15px; color:${INK};">${value}</td></tr>`
}

// Redesigned 2026-10-13 (owner: "update and redesign the leads email"): same look as the outreach emails — logo header with an
// orange rule, the buyer's details in a card, big reply buttons, and the dashboard link. Content and reply links are unchanged.
export function renderLeadAlertEmailHTML(input: LeadAlertEmailInput): string {
  const what = input.planName ? `${escapeHtml(input.planName)} · ${escapeHtml(input.projectName)}` : escapeHtml(input.projectName)
  const { replyLinks } = input
  const buttons = [
    replyLinks.whatsapp ? button(replyLinks.whatsapp, 'Reply on WhatsApp', '#16a34a') : '',
    replyLinks.call ? button(replyLinks.call, 'Call', INK) : '',
    replyLinks.email ? button(replyLinks.email, 'Email', INK) : '',
  ].filter(Boolean).join('')
  const when = input.receivedAt.toLocaleString('en-GB', { timeZone: 'Asia/Colombo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>New lead: ${what}</title>
</head>
<body style="margin:0; padding:24px 12px; background-color:#f3f1ec; font-family:Arial, Helvetica, sans-serif;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${escapeHtml(input.buyerName)} asked about ${what}${input.buyerPhone ? ` — ${escapeHtml(input.buyerPhone)}` : ''}.</div>
  <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; margin:0 auto; background-color:#ffffff; border:1px solid ${LINE};">
    <tr><td style="padding:22px 32px 18px; border-bottom:3px solid ${ACCENT};"><a href="https://www.lankanewhomes.com" style="text-decoration:none;"><img src="https://www.lankanewhomes.com/brand/logo-email.png" width="130" alt="LankaNewHomes" style="display:block; border:0; width:130px; height:auto; font-size:18px; font-weight:700; color:#1f1f1f;"></a></td></tr>
    <tr><td style="padding:26px 32px 4px;">
      <div style="font-size:12px; letter-spacing:0.06em; color:${ACCENT}; font-weight:700; text-transform:uppercase;">New lead · ${escapeHtml(input.sourceLabel)}</div>
      <div style="margin:6px 0 4px; font-size:22px; line-height:1.3; font-weight:700; color:${INK};">${what}</div>
      <div style="font-size:13px; color:${MUTED};">Received ${when} (Sri Lanka time)</div>
    </td></tr>
    <tr><td style="padding:18px 32px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER}; border:1px solid ${LINE}; border-left:4px solid ${ACCENT};"><tr><td style="padding:16px 18px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          ${row('Name', `<strong>${escapeHtml(input.buyerName)}</strong>`)}
          ${input.buyerPhone ? row('Phone', replyLinks.call ? `<a href="${replyLinks.call}" style="color:${INK};">${escapeHtml(input.buyerPhone)}</a>` : escapeHtml(input.buyerPhone)) : ''}
          ${input.buyerEmail ? row('Email', replyLinks.email ? `<a href="${replyLinks.email}" style="color:${INK};">${escapeHtml(input.buyerEmail)}</a>` : escapeHtml(input.buyerEmail)) : ''}
          ${input.preferredContact ? row('Prefers', escapeHtml(input.preferredContact)) : ''}
          ${input.message ? row('Message', `“${escapeHtml(input.message).replace(/\n/g, '<br>')}”`) : ''}
        </table>
      </td></tr></table>
    </td></tr>
    ${buttons ? `<tr><td style="padding:18px 32px 0;"><table role="presentation" cellpadding="0" cellspacing="0"><tr>${buttons}</tr></table><div style="font-size:12px; color:${MUTED}; margin-top:2px;">Tapping a reply button marks this lead as contacted for you.</div></td></tr>` : ''}
    <tr><td style="padding:18px 32px 8px;"><a href="${input.dashboardUrl}" style="font-size:14px; font-weight:700; color:${ACCENT}; text-decoration:underline;">Open this lead in your dashboard</a></td></tr>
    <tr><td style="padding:14px 32px 26px; border-top:1px solid ${LINE}; margin-top:12px; font-size:12px; line-height:1.6; color:${MUTED};">Buyers usually go with the first developer who answers. Your reply time is tracked on your dashboard.<br>LankaNewHomes · New homes and land for sale in Sri Lanka</td></tr>
  </table>
</body>
</html>`
}

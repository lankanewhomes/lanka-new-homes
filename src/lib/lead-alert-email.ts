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

function button(href: string, label: string, color: string): string {
  return `<td align="center" style="padding:4px 6px;">
    <a href="${href}" style="display:inline-block; padding:12px 22px; font-size:14px; font-weight:700; color:#ffffff; background-color:${color}; text-decoration:none; border-radius:999px;">${label}</a>
  </td>`
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0; font-size:13px; color:#9a9282; width:130px; vertical-align:top;">${label}</td>
    <td style="padding:6px 0; font-size:14px; color:#1f1f1f; vertical-align:top;">${value}</td>
  </tr>`
}

export function renderLeadAlertEmailHTML(input: LeadAlertEmailInput): string {
  const what = input.planName ? `${escapeHtml(input.planName)} · ${escapeHtml(input.projectName)}` : escapeHtml(input.projectName)
  const { replyLinks } = input
  const buttons = [
    replyLinks.whatsapp ? button(replyLinks.whatsapp, 'Reply on WhatsApp', '#25d366') : '',
    replyLinks.call ? button(replyLinks.call, 'Call', '#1f1f1f') : '',
    replyLinks.email ? button(replyLinks.email, 'Email', '#1f1f1f') : '',
  ].filter(Boolean).join('')

  const when = input.receivedAt.toLocaleString('en-GB', { timeZone: 'Asia/Colombo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>New lead: ${what}</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f0; font-family:Helvetica, Arial, sans-serif;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    ${escapeHtml(input.buyerName)} asked about ${what}${input.buyerPhone ? ` — ${escapeHtml(input.buyerPhone)}` : ''}.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%; max-width:520px; background-color:#ffffff; border-radius:8px; overflow:hidden;">

          <tr>
            <td align="center" style="padding:32px 32px 8px;">
              <span style="font-size:20px; font-weight:700; color:#1f1f1f;">Lanka<span style="color:#f47b36;">New</span>Homes</span>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:12px 32px 0;">
              <p style="margin:0 0 6px; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#f47b36; font-weight:700;">${escapeHtml(input.sourceLabel)}</p>
              <h1 style="margin:0; font-size:22px; line-height:1.3; color:#1f1f1f; font-weight:700;">${what}</h1>
              <p style="margin:8px 0 0; font-size:13px; color:#9a9282;">Received ${when} (Sri Lanka time)</p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:22px 32px 6px;">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr>${buttons}</tr></table>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e4e0d8; padding-top:12px;">
                ${row('Name', escapeHtml(input.buyerName))}
                ${input.buyerPhone ? row('Phone', replyLinks.call ? `<a href="${replyLinks.call}" style="color:#1f1f1f;">${escapeHtml(input.buyerPhone)}</a>` : escapeHtml(input.buyerPhone)) : ''}
                ${input.buyerEmail ? row('Email', replyLinks.email ? `<a href="${replyLinks.email}" style="color:#1f1f1f;">${escapeHtml(input.buyerEmail)}</a>` : escapeHtml(input.buyerEmail)) : ''}
                ${input.preferredContact ? row('Prefers', escapeHtml(input.preferredContact)) : ''}
                ${input.message ? row('Message', escapeHtml(input.message).replace(/\n/g, '<br>')) : ''}
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:24px 32px 8px;">
              <p style="margin:0 0 10px; font-size:13px; color:#4a4a4a;">Tapping a reply button above marks this lead as contacted for you.</p>
              <a href="${input.dashboardUrl}" style="font-size:14px; font-weight:700; color:#f47b36; text-decoration:none;">Open in your dashboard</a>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:8px 32px 32px;">
              <p style="margin:0; font-size:12px; line-height:1.6; color:#9a9282;">
                Buyers usually go with the first developer who answers — your reply time is tracked on your dashboard.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

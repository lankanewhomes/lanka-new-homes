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

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function button(href: string, label: string, color: string): string {
  return `<td align="center" style="padding:4px 6px;">
    <a href="${href}" style="display:inline-block; padding:12px 22px; font-size:14px; font-weight:700; color:#ffffff; background-color:${color}; text-decoration:none; border-radius:999px;">${label}</a>
  </td>`
}

export function renderLeadConfirmationEmailHTML(input: LeadConfirmationEmailInput): string {
  const what = input.planName ? `${escapeHtml(input.planName)} at ${escapeHtml(input.projectName)}` : escapeHtml(input.projectName)
  const developer = escapeHtml(input.developerName)
  const phoneDigits = input.developerPhone ? input.developerPhone.split(/\s*\/\s*/)[0].replace(/[^+\d]/g, '') : ''
  // "on WhatsApp on 077 …", "by email at you@…", "by phone on 077 …".
  const preferred = (input.preferredContact ?? '').trim().toLowerCase()
  const channel = preferred === 'whatsapp' ? 'on WhatsApp' : preferred === 'email' ? 'by email' : preferred === 'text' ? 'by text message' : preferred === 'phone' ? 'by phone' : ''
  const where = preferred === 'email' ? (input.buyerEmail ? ` at ${escapeHtml(input.buyerEmail)}` : '') : input.buyerPhone ? ` on ${escapeHtml(input.buyerPhone)}` : ''
  const reachYou = channel ? `${channel}${where}` : input.buyerPhone ? `on ${escapeHtml(input.buyerPhone)}` : ''
  const buttons = [
    input.developerWhatsAppHref ? button(input.developerWhatsAppHref, `WhatsApp ${developer}`, '#25d366') : '',
    phoneDigits ? button(`tel:${phoneDigits}`, 'Call them', '#1f1f1f') : '',
    button(input.projectUrl, 'View the listing', '#f47b36'),
  ].filter(Boolean).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Your request was sent to ${developer}</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f0; font-family:Helvetica, Arial, sans-serif;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    ${developer} has your request about ${what}${reachYou ? ` and will reach you ${reachYou}` : ''}.
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
              <h1 style="margin:0; font-size:22px; line-height:1.3; color:#1f1f1f; font-weight:700;">Your request was sent to ${developer}</h1>
              <p style="margin:12px 0 0; font-size:15px; line-height:1.6; color:#4a4a4a;">
                Hi ${escapeHtml(input.buyerName)}, thanks for asking about <strong>${what}</strong>.
                ${developer} has your details${reachYou ? ` and will get back to you ${reachYou}` : ''}.
              </p>
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
                <tr><td style="padding:6px 0; font-size:13px; color:#9a9282; width:130px;">Developer</td><td style="padding:6px 0; font-size:14px; color:#1f1f1f;">${developer}</td></tr>
                ${input.developerPhone ? `<tr><td style="padding:6px 0; font-size:13px; color:#9a9282;">Phone</td><td style="padding:6px 0; font-size:14px; color:#1f1f1f;">${escapeHtml(input.developerPhone)}</td></tr>` : ''}
                ${input.developerEmail ? `<tr><td style="padding:6px 0; font-size:13px; color:#9a9282;">Email</td><td style="padding:6px 0; font-size:14px; color:#1f1f1f;"><a href="mailto:${escapeHtml(input.developerEmail)}" style="color:#1f1f1f;">${escapeHtml(input.developerEmail)}</a></td></tr>` : ''}
                ${input.message ? `<tr><td style="padding:6px 0; font-size:13px; color:#9a9282; vertical-align:top;">Your message</td><td style="padding:6px 0; font-size:14px; color:#1f1f1f;">${escapeHtml(input.message).replace(/\n/g, '<br>')}</td></tr>` : ''}
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:24px 32px 32px;">
              <p style="margin:0; font-size:13px; line-height:1.6; color:#9a9282;">
                You can follow this and every request you've made under <a href="${input.enquiriesUrl}" style="color:#f47b36; font-weight:700; text-decoration:none;">My enquiries</a>.
                Replying to this email reaches ${developer} directly.
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

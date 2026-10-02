// "Please confirm your listings" — sent to a developer after their
// project(s)/land(s) are added or imported on their behalf, asking them to
// review and confirm the details are accurate. Same visual style as
// lead-confirmation-email.ts / brochure-email.ts (brand header, single card,
// #f47b36 accent).

export type ListingConfirmationItem = {
  name: string
  url: string
  /** e.g. "Land for sale" / "Villa" / "Published" / "Pending review" */
  note?: string
}

export type DeveloperListingConfirmationEmailInput = {
  developerName: string
  contactName?: string | null
  listings: ListingConfirmationItem[]
  /** Where a reply lands, or who to contact with corrections. */
  supportEmail: string
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function renderDeveloperListingConfirmationEmailHTML(input: DeveloperListingConfirmationEmailInput): string {
  const greetingName = input.contactName?.trim() || 'there'
  const rows = input.listings
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid #eee8db; font-size:14px; color:#1f1f1f;">
          <a href="${item.url}" style="color:#1f1f1f; font-weight:700; text-decoration:none;">${escapeHtml(item.name)}</a>
          ${item.note ? `<div style="margin-top:2px; font-size:12px; color:#9a9282;">${escapeHtml(item.note)}</div>` : ''}
        </td>
        <td align="right" style="padding:10px 0; border-bottom:1px solid #eee8db;">
          <a href="${item.url}" style="font-size:12px; font-weight:700; color:#f47b36; text-decoration:none; white-space:nowrap;">View listing &rarr;</a>
        </td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Please confirm your listings on LankaNewHomes</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f0; font-family:Helvetica, Arial, sans-serif;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    We've added ${input.listings.length} listing${input.listings.length === 1 ? '' : 's'} for ${escapeHtml(input.developerName)} — please review for accuracy.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%; max-width:560px; background-color:#ffffff; border-radius:8px; overflow:hidden;">

          <tr>
            <td align="center" style="padding:32px 32px 8px;">
              <span style="font-size:20px; font-weight:700; color:#1f1f1f;">Lanka<span style="color:#f47b36;">New</span>Homes</span>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:12px 32px 0;">
              <h1 style="margin:0; font-size:22px; line-height:1.3; color:#1f1f1f; font-weight:700;">Please confirm your listings</h1>
              <p style="margin:12px 0 0; font-size:15px; line-height:1.6; color:#4a4a4a;">
                Hi ${escapeHtml(greetingName)}, we've added the following ${input.listings.length === 1 ? 'listing' : 'listings'} for
                <strong>${escapeHtml(input.developerName)}</strong> on LankaNewHomes. Please take a look and confirm the pricing,
                availability, and details are accurate.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:24px 32px 32px;">
              <p style="margin:0; font-size:13px; line-height:1.6; color:#9a9282;">
                If anything needs to be corrected or updated, just reply to this email or reach us at
                <a href="mailto:${escapeHtml(input.supportEmail)}" style="color:#f47b36; font-weight:700; text-decoration:none;">${escapeHtml(input.supportEmail)}</a>
                and we'll fix it right away. If everything looks good, no action is needed.
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

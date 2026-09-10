// Branded HTML for the weekly "what's new" digest sent to buyers who follow
// a developer — same visual style as the lead-alert email. Content lines
// (price changes, new floor plans, construction updates) are pre-built as
// plain strings in src/lib/follower-digest.ts; this file only renders them.

export type FollowerDigestProjectGroup = {
  slug: string
  name: string
  lines: string[]
}

export type FollowerDigestDeveloperGroup = {
  developerName: string
  developerSlug: string
  projects: FollowerDigestProjectGroup[]
}

export type FollowerDigestEmailInput = {
  buyerName: string | null
  groups: FollowerDigestDeveloperGroup[]
  serverURL: string
  accountUrl: string
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function renderFollowerDigestEmailHTML(input: FollowerDigestEmailInput): string {
  const greetingName = input.buyerName ? escapeHtml(input.buyerName) : 'there'
  const projectBlocks = input.groups
    .map((group) => {
      const projectRows = group.projects
        .map(
          (project) => `
            <tr>
              <td style="padding:10px 0; border-top:1px solid #e4e0d8;">
                <a href="${input.serverURL}/projects/${escapeHtml(project.slug)}" style="font-size:15px; font-weight:700; color:#1f1f1f; text-decoration:none;">${escapeHtml(project.name)}</a>
                <ul style="margin:6px 0 0; padding-left:18px;">
                  ${project.lines.map((line) => `<li style="font-size:13px; line-height:1.6; color:#4a4a4a;">${escapeHtml(line)}</li>`).join('')}
                </ul>
              </td>
            </tr>`
        )
        .join('')

      return `
        <tr>
          <td style="padding:18px 32px 0;">
            <p style="margin:0 0 4px; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#f47b36; font-weight:700;">${escapeHtml(group.developerName)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${projectRows}
            </table>
          </td>
        </tr>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Updates from developers you follow</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f0; font-family:Helvetica, Arial, sans-serif;">
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
            <td align="center" style="padding:8px 32px 0;">
              <h1 style="margin:0; font-size:20px; line-height:1.3; color:#1f1f1f; font-weight:700;">Hi ${greetingName}, here's what's new</h1>
              <p style="margin:8px 0 0; font-size:13px; color:#9a9282;">From developers you follow</p>
            </td>
          </tr>

          ${projectBlocks}

          <tr>
            <td align="center" style="padding:28px 32px 8px;">
              <a href="${input.accountUrl}" style="font-size:14px; font-weight:700; color:#f47b36; text-decoration:none;">Manage what you follow</a>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:8px 32px 32px;">
              <p style="margin:0; font-size:12px; line-height:1.6; color:#9a9282;">
                You're getting this because email notifications are on in your account settings — turn them off any time from ${input.accountUrl}.
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

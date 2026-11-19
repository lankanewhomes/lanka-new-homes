import { emailShell, emailHero, emailButton } from './email-layout'
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

  const body = [
    emailHero(`Hi ${greetingName}, here's what's new`, 'From developers you follow'),
    projectBlocks,
    emailButton('Manage what you follow', input.accountUrl),
  ].join('\n')
  return emailShell({ preheader: 'Updates from the developers you follow on LankaNewHomes.', title: 'Updates from developers you follow', body, footerNote: `You're getting this because email notifications are on in your account settings. Turn them off any time from ${escapeHtml(input.accountUrl)}.` })
}

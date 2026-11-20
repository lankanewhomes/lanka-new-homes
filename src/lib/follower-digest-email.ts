import { emailShell, emailHero, emailButton, emailListingCard, emailSectionLabel, emailTeamSignoff, emailNoteRow } from './email-layout'
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
    .map((group) =>
      [
        emailSectionLabel(escapeHtml(group.developerName)),
        ...group.projects.map((project) => emailListingCard({ name: escapeHtml(project.name), href: `${input.serverURL}/projects/${project.slug}`, lines: project.lines.map(escapeHtml) })),
      ].join('\n'),
    )
    .join('\n')

  const body = [
    emailHero(`Hi ${greetingName}, here's what's new`, 'From developers you follow'),
    projectBlocks,
    emailButton('Manage what you follow', input.accountUrl),
    emailTeamSignoff(),
  ].join('\n')
  return emailShell({ preheader: 'Updates from the developers you follow on LankaNewHomes.', title: 'Updates from developers you follow', body, footerNote: '', lastRow: emailNoteRow(`You're getting this because email notifications are on in your account settings. Turn them off any time from ${escapeHtml(input.accountUrl)}.`) })
}

import { emailShell, emailHero, emailPara, emailSignoff, emailListingCard } from './email-layout'
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
  const cards = input.listings.map((item) => emailListingCard({ name: escapeHtml(item.name), href: item.url, meta: item.note ? escapeHtml(item.note) : undefined })).join('\n')
  const body = [
    emailHero('Please confirm your listings', `Hi ${escapeHtml(greetingName)}, we've added the following ${input.listings.length === 1 ? 'listing' : 'listings'} for <strong>${escapeHtml(input.developerName)}</strong> on LankaNewHomes. Please take a look and confirm the pricing, availability and details are accurate.`),
    `  <tr><td style="padding:10px 32px 0;"></td></tr>`,
    cards,
    emailPara(`If anything needs to be corrected or updated, just reply to this email or reach us at <a href="mailto:${escapeHtml(input.supportEmail)}" style="color:#1c1c20;font-weight:700;">${escapeHtml(input.supportEmail)}</a> and we'll fix it right away. If everything looks good, no action is needed.`, true),
    emailSignoff(),
  ].join('\n')
  return emailShell({ preheader: `We've added ${input.listings.length} listing${input.listings.length === 1 ? '' : 's'} for ${input.developerName}. Please review for accuracy.`, title: 'Please confirm your listings on LankaNewHomes', body })
}

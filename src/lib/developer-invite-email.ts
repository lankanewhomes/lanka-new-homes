import { emailButton, emailHero, emailNumbered, emailPanel, emailPara, emailShell, emailSignoff, verifiedPill } from './email-layout'
// "Your page is live: register and get Verified" email for developers (owner, 2026-10-05). Pure rendering only:
// nothing here sends mail. scripts/generate-developer-invite-emails.ts builds one per developer into local files.
export type DeveloperInviteInput = {
  name: string
  slug: string
  projects: string[]
  lands: string[]
  phone?: string | null
  email?: string | null
  address?: string | null
  website?: string | null
  /** true when the email on file is on the company's own domain (or an approved extra one): registering with it links and verifies automatically. */
  autoVerify?: boolean
  /** The company-domain address to register with, when it differs from the contact email we show (e.g. a developer's head-office mailbox). */
  verifyEmail?: string | null
  /** The address buyer enquiries from the site go to, when it is the developer's own (not routed to an agency). */
  leadsEmail?: string | null
  /** Details we still need per listing (from the CMS to-do list), shown as "We are missing some details". */
  missing?: { listing: string; items: string[] }[]
  siteUrl?: string
}

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function developerInviteSubject(name: string): string {
  return `Your ${name} page on LankaNewHomes: register and get Verified`
}

export function renderDeveloperInviteHTML(input: DeveloperInviteInput): string {
  const site = input.siteUrl ?? 'https://www.lankanewhomes.com'
  const listed: string[] = []
  if (input.projects.length) listed.push(`${input.projects.length} project${input.projects.length === 1 ? '' : 's'}: ${input.projects.map(esc).join(', ')}`)
  if (input.lands.length) listed.push(`${input.lands.length} land listing${input.lands.length === 1 ? '' : 's'}: ${input.lands.map(esc).join(', ')}`)
  const contact: string[] = []
  if (input.phone) contact.push(`Phone: ${esc(input.phone)}`)
  if (input.email) contact.push(`Email: ${esc(input.email)}`)
  if (input.address) contact.push(`Address: ${esc(input.address)}`)
  if (input.website) contact.push(`Website: ${esc(input.website.replace(/^https?:\/\//, '').replace(/\/$/, ''))}`)
  const box = (title: string, lines: string[], footer = '') => lines.length || footer
    ? emailPanel({ heading: title, bodyHtml: lines.map((l) => `&bull; ${l}`).join('<br>') + (footer ? `<div style="margin-top:10px;color:#6b6a66;">${footer}</div>` : '') })
    : ''
  const missingLines = (input.missing ?? []).filter((m) => m.items.length).map((m) => `<strong>${esc(m.listing)}</strong>: ${m.items.map(esc).join('; ')}`)
  const verifyEmail = input.verifyEmail ? esc(input.verifyEmail) : input.email ? esc(input.email) : 'an email on your company website domain'
  // Tagged so a click shows up in Google Analytics as source "developer-invite" (content = the developer's slug).
  const utm = `utm_source=developer-invite&utm_medium=email&utm_campaign=verify-developer&utm_content=${encodeURIComponent(input.slug)}`
  const steps = input.autoVerify
    ? [
        { title: 'Register', body: `Register your developer account with ${verifyEmail}.` },
        { title: 'Confirm', body: 'Open the confirmation email we send to that address and confirm it.' },
        { title: 'Log in once', body: 'Your account links to this page and the Verified Developer badge turns on automatically.' },
      ]
    : [
        { title: 'Register', body: 'Register your developer account.' },
        { title: 'Reply to this email', body: `We link it to your ${esc(input.name)} page.` },
        { title: 'Add your company email', body: 'In your company profile, open "Verified Developer" and enter an email on your company website domain.' },
        { title: 'Confirm', body: 'Open the link we send you and press Confirm. Your page then shows the Verified Developer badge.' },
      ]
  const body = [
    `  <tr><td style="padding:30px 32px 0;">${verifiedPill()}</td></tr>`,
    emailHero(`Your ${esc(input.name)} page is live. Register and get Verified.`),
    emailPara(`Hello ${esc(input.name)} team, we created a free developer page for your company so buyers can find your projects.`),
    emailPara('LankaNewHomes is a free website where buyers in Sri Lanka and abroad browse new homes, apartments and land, with real prices, floor plans and photos, and send enquiries straight to developers.', true),
    emailButton('View your page', `${site}/developers/${input.slug}?${utm}`, undefined, { bg: '#1c1c20', fg: '#ffffff' }),
    box('What we have listed for you', listed),
    input.leadsEmail ? box('Enquiries', [`Buyer enquiries from the LankaNewHomes website go directly to ${esc(input.leadsEmail)}.`]) : '',
    box('Contact details we show', contact, `Something wrong? Reply to this email or write to <a href="mailto:developers@lankanewhomes.com" style="color:#1c1c20;">developers@lankanewhomes.com</a>.`),
    box('We are missing some details', missingLines, 'Reply to this email with whatever you can and we will update your listings straight away.'),
    emailPara('<strong style="font-size:16px;">Take control of your page (free)</strong>'),
    emailNumbered(steps),
    emailButton('Register my developer account', `${site}/developers/register?${utm}`),
    emailPara('Buyers see that your company identity is confirmed, and you can edit your listings and see enquiries and views.', true),
    emailSignoff(),
  ].join('\n')
  return emailShell({ preheader: `Your ${input.name} page is live on LankaNewHomes. Register and get Verified.`, title: developerInviteSubject(input.name), body })
}

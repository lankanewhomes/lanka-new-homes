import { emailButton, emailCompactList, emailHero, emailPanel, emailSectionLabel, emailShell, emailSignoff, esc, verifiedPill } from './email-layout'

// Sender (owner, 2026-11-22): send from developers@lankanewhomes.com, not no-reply@, because the email invites replies.
// Weekly report for a developer: how their listings did on LankaNewHomes in the last 7 days (owner, 2026-11-22: "weekly report email i want to
// send it to developers"). Same shell as every other email (emailShell, the lead-notice look). Counts only: no buyer names, phones or emails.
// Views and enquiries only: project_views holds no click, save, brochure or share events yet (checked 2026-11-22), so those sections were
// left out rather than always showing 0. No automatic schedule yet: render with scripts/preview-developer-weekly-report-email.ts, send by hand with scripts/send-developer-weekly-reports.ts.

export type WeeklyReportListing = { name: string; url: string; views: number; enquiries: number }

export type DeveloperWeeklyReportInput = {
  developerName: string
  developerSlug: string
  /** A developer account is linked to this company. Without one there is no dashboard to open, so the buttons point to the public page and to Register. */
  hasAccount: boolean
  /** The company already shows the Verified Developer badge. When false, a "Get verified" section is added at the bottom (owner, 2026-11-22). */
  verified: boolean
  /** First and last day covered, both inclusive. */
  from: Date
  to: Date
  views: number
  previousViews: number
  enquiries: number
  previousEnquiries: number
  /** Enquiries still marked New (no reply recorded), all time. */
  waitingForReply: number
  listings: WeeklyReportListing[]
  /** Paid Featured placements this week (times shown, clicks, leads), one row per placement. The section is left out when empty (owner, 2026-11-22: "if there is featured data also include that"). */
  featured?: { label: string; impressions: number; clicks: number; leads: number }[]
  dashboardUrl: string
  siteUrl?: string
}

const INK = '#1c1c20'
const MUTED = '#6b6a66'
const LINE = '#e4e2db'
const GREEN = '#1a7f4b'
const RED = '#b3261e'

const day = (d: Date, withYear = false) => d.toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo', day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) })
const n = (v: number) => v.toLocaleString('en-US')

export const weeklyReportRange = (i: Pick<DeveloperWeeklyReportInput, 'from' | 'to'>) => `${day(i.from)} to ${day(i.to, true)}`

export function developerWeeklyReportSubject(i: DeveloperWeeklyReportInput): string {
  return `Your week on LankaNewHomes: ${n(i.views)} ${i.views === 1 ? 'view' : 'views'}, ${n(i.enquiries)} ${i.enquiries === 1 ? 'enquiry' : 'enquiries'} (${weeklyReportRange(i)})`
}

/** "+12% vs last week" in green, a drop in red, and plain grey words when there is nothing to compare with. */
function change(now: number, before: number): string {
  if (before === 0) return `<span style="color:${MUTED};">${now === 0 ? 'Same as last week' : 'New this week'}</span>`
  const pct = Math.round(((now - before) / before) * 100)
  if (pct === 0) return `<span style="color:${MUTED};">Same as last week</span>`
  return `<span style="color:${pct > 0 ? GREEN : RED};font-weight:700;">${pct > 0 ? '&#9650; +' : '&#9660; '}${pct}%</span> <span style="color:${MUTED};">vs last week</span>`
}

function tiles(items: { label: string; value: number; before: number }[]): string {
  const cells = items.map((t, idx) => `<td width="${Math.floor(100 / items.length)}%" valign="top" style="padding:16px 12px;background:#faf7f2;border:1px solid ${LINE};${idx ? 'border-left:0;' : ''}text-align:center;">
        <div style="font-size:30px;line-height:1.1;font-weight:700;color:${INK};">${n(t.value)}</div>
        <div style="margin:6px 0 6px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${INK};">${t.label}</div>
        <div style="font-size:12px;line-height:1.4;">${change(t.value, t.before)}</div>
      </td>`).join('')
  return `  <tr><td style="padding:18px 32px 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:4px solid #f47b36;"><tr>${cells}</tr></table></td></tr>`
}

function listingTable(listings: WeeklyReportListing[]): string {
  const th = `padding:9px 12px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${MUTED};background:#faf7f2;border-bottom:1px solid ${LINE};`
  const td = `padding:11px 12px;font-size:14px;color:${INK};border-bottom:1px solid ${LINE};`
  const rows = listings.map((l) => `<tr><td style="${td}"><a href="${esc(l.url)}" style="color:${INK};font-weight:700;text-decoration:underline;">${esc(l.name)}</a></td><td align="right" style="${td}">${n(l.views)}</td><td align="right" style="${td}">${n(l.enquiries)}</td></tr>`).join('')
  return `  <tr><td style="padding:0 32px 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${LINE};border-bottom:0;"><tr><th align="left" style="${th}">Listing</th><th align="right" style="${th}">Views</th><th align="right" style="${th}">Enquiries</th></tr>${rows}</table></td></tr>`
}

/** Bottom section for companies without the badge: the steps to get Verified, and one button. Same steps as the invite email (developer-invite-email.ts). */
function getVerified(i: DeveloperWeeklyReportInput, site: string, utm: string): string {
  if (i.verified) return ''
  const steps = i.hasAccount
    ? [
        { title: 'Open your company profile', body: 'Log in and open "Verified Developer".' },
        { title: 'Add your company email', body: 'Enter an email on your company website domain.' },
        { title: 'Confirm', body: 'Open the link we send you and press Confirm. Your page then shows the badge.' },
      ]
    : [
        { title: 'Register', body: 'Create your free developer account.' },
        { title: 'Add your company email', body: 'In your company profile, open "Verified Developer" and enter an email on your company website domain.' },
        { title: 'Confirm', body: 'Open the link we send you and press Confirm. Your page then shows the badge.' },
      ]
  return [
    `  <tr><td style="padding:30px 32px 0;"><div style="border-top:1px solid ${LINE};padding-top:26px;">${verifiedPill()}</div></td></tr>`,
    `  <tr><td style="padding:12px 32px 2px;font-size:21px;font-weight:700;line-height:1.3;color:${INK};">${i.hasAccount ? 'Get the Verified Developer badge. It is free.' : 'Not registered yet? Get verified. It is free.'}</td></tr>`,
    `  <tr><td style="padding:6px 32px 4px;font-size:14px;line-height:1.6;color:${MUTED};">Buyers see that your company identity is confirmed${i.hasAccount ? '.' : ', and you can edit your listings and see your enquiries and views in one place.'}</td></tr>`,
    emailCompactList(steps),
    i.hasAccount ? emailButton('Get verified', `${i.dashboardUrl}`) : emailButton('Register my developer account', `${site}/developers/register?${utm}`, { label: 'Already registered? Log in', href: `${site}/developers/login?${utm}` }),
  ].join('\n')
}

function featuredTable(rows: NonNullable<DeveloperWeeklyReportInput['featured']>): string {
  const th = `padding:9px 12px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${MUTED};background:#fef1e8;border-bottom:1px solid ${LINE};`
  const td = `padding:11px 12px;font-size:14px;color:${INK};border-bottom:1px solid ${LINE};`
  const body = rows.map((r) => `<tr><td style="${td}font-weight:700;">${esc(r.label)}</td><td align="right" style="${td}">${n(r.impressions)}</td><td align="right" style="${td}">${n(r.clicks)}</td><td align="right" style="${td}">${n(r.leads)}</td></tr>`).join('')
  return `  <tr><td style="padding:0 32px 4px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${LINE};border-bottom:0;border-left:4px solid #f47b36;"><tr><th align="left" style="${th}">Placement</th><th align="right" style="${th}">Shown</th><th align="right" style="${th}">Clicks</th><th align="right" style="${th}">Leads</th></tr>${body}</table></td></tr>
  <tr><td style="padding:2px 32px 0;font-size:12px;line-height:1.5;color:${MUTED};">Shown is how many times buyers saw your Featured placement.</td></tr>`
}

export function renderDeveloperWeeklyReportHTML(i: DeveloperWeeklyReportInput): string {
  const site = i.siteUrl ?? 'https://www.lankanewhomes.com'
  // Tagged so a click shows up in Google Analytics as source "weekly-report" (content = the developer's slug).
  const utm = `utm_source=weekly-report&utm_medium=email&utm_campaign=developer-weekly-report&utm_content=${encodeURIComponent(i.developerSlug)}`
  const pageUrl = `${site}/developers/${i.developerSlug}?${utm}`
  const top = [...i.listings].sort((a, b) => b.views - a.views || b.enquiries - a.enquiries).slice(0, 8)
  const hidden = i.listings.length - top.length
  const body = [
    emailHero('Your week on LankaNewHomes.', `${esc(i.developerName)} &nbsp;·&nbsp; ${esc(weeklyReportRange(i))}`),
    tiles([
      { label: 'Listing views', value: i.views, before: i.previousViews },
      { label: 'Enquiries', value: i.enquiries, before: i.previousEnquiries },
    ]),
    i.waitingForReply > 0
      ? emailPanel({
          heading: `${n(i.waitingForReply)} ${i.waitingForReply === 1 ? 'buyer is' : 'buyers are'} waiting for your reply`,
          bodyHtml: `${i.waitingForReply === 1 ? 'This enquiry is' : 'These enquiries are'} still marked New. Buyers usually go with the first developer who answers, and your reply time shows on your profile.${i.hasAccount ? `<div style="margin:12px 0 0;"><a href="${esc(i.dashboardUrl)}" style="font-weight:700;color:${INK};text-decoration:underline;">Open your enquiries &rarr;</a></div>` : ''}`,
        })
      : '',
    i.featured?.length ? emailSectionLabel('Your Featured placements this week') : '',
    i.featured?.length ? featuredTable(i.featured) : '',
    top.length ? emailSectionLabel('Your listings this week') : '',
    top.length ? listingTable(top) : '',
    hidden > 0 ? `  <tr><td style="padding:4px 32px 0;font-size:12px;color:${MUTED};">Plus ${hidden} more ${hidden === 1 ? 'listing' : 'listings'} in your dashboard.</td></tr>` : '',
    i.hasAccount ? emailButton('Open your dashboard', i.dashboardUrl) : emailButton('View your page', pageUrl, undefined, { bg: INK, fg: '#ffffff' }),
    `  <tr><td style="padding:14px 32px 0;font-size:15px;line-height:1.65;color:#2b2b29;">Is a price, unit or photo out of date? Reply to this email and we will update your listing.</td></tr>`,
    getVerified(i, site, utm),
    emailSignoff(),
  ].filter(Boolean).join('\n')
  return emailShell({
    preheader: `${n(i.views)} ${i.views === 1 ? 'view' : 'views'} and ${n(i.enquiries)} ${i.enquiries === 1 ? 'enquiry' : 'enquiries'} on your listings, ${weeklyReportRange(i)}.`,
    title: 'Your week on LankaNewHomes',
    body,
    footerNote: 'You are receiving this weekly report because your company or project is listed on LankaNewHomes.',
  })
}

// Sends ONE test copy of every email design to the owner only (owner, 2026-11-23: "send me test emails").
// Never sends to a developer or buyer: TO is fixed to the owner's Gmail and every name, phone and message is sample data.
// Reads nothing from the database and changes nothing. Every subject starts with [TEST n/N].
//   npx tsx scripts/send-all-test-emails.ts            send all
//   ONLY=3,7 npx tsx scripts/send-all-test-emails.ts   send only those numbers
//   DRY=1 npx tsx scripts/send-all-test-emails.ts      list them, send nothing (add OUT=<folder> to save each as HTML)
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
// Tracked links must point at the live site, never localhost (mistake made on 2026-11-15).
const SITE = 'https://www.lankanewhomes.com'
process.env.NEXT_PUBLIC_SITE_URL = SITE
process.env.NEXT_PUBLIC_SERVER_URL = SITE

const TO = 'lankanewhomes@gmail.com'
const NOREPLY = 'no-reply@lankanewhomes.com'
const DEVELOPERS = 'developers@lankanewhomes.com'

const { sendMail } = await import('../src/lib/mailer')
const { renderLeadAlertEmailHTML } = await import('../src/lib/lead-alert-email')
const { renderLeadNoticeHTML, leadNoticeSubject } = await import('../src/lib/lead-notice-email')
const { renderLeadReminderEmailHTML, leadReminderSubject } = await import('../src/lib/lead-reminder-email')
const { renderLeadConfirmationEmailHTML } = await import('../src/lib/lead-confirmation-email')
const { renderBrochureEmailHTML } = await import('../src/lib/brochure-email')
const { renderSavedSearchAlertEmailHTML } = await import('../src/lib/saved-search-alert-email')
const { renderFollowerDigestEmailHTML } = await import('../src/lib/follower-digest-email')
const { renderNewsletter, SAMPLE_NEWSLETTER } = await import('../src/lib/newsletter-email')
const { renderDeveloperWeeklyReportHTML, developerWeeklyReportSubject } = await import('../src/lib/developer-weekly-report-email')
const { renderDeveloperInviteHTML, developerInviteSubject } = await import('../src/lib/developer-invite-email')
const { renderDeveloperListingConfirmationEmailHTML } = await import('../src/lib/developer-listing-confirmation-email')
const { renderDeveloperVerifiedHTML, developerVerifiedSubject } = await import('../src/lib/developer-verified-email')
const { renderDeveloperMissingInfoHTML, developerMissingInfoSubject } = await import('../src/lib/developer-missing-info-email')
const { renderOutreachEmail } = await import('../src/lib/outreach-templates')
const { renderVerificationEmailHTML, renderPasswordResetEmailHTML, renderSignInLinkEmailHTML } = await import('../src/collections/auth/verification-email')

// Sample data only. The listing links open real pages on the site so the buttons can be tried.
const PROJECT = 'Sample Residences'
const PLAN = '2 Bedroom, Type A'
const DEV = 'Sample Developer'
const projectUrl = `${SITE}/projects/luxury-apartments-for-sale-in-colombo`
const dashboardUrl = `${SITE}/dashboard`
const buyer = { buyerName: 'Test Buyer', buyerPhone: '+94 11 000 0000', buyerEmail: 'buyer@example.com', preferredContact: 'WhatsApp', message: 'This is a sample enquiry. Is the 2 bedroom still available, and what is the payment plan?' }
// Reply buttons go to the site, not to WhatsApp or the dialer, so a tap never reaches a real person.
const replyLinks = { whatsapp: projectUrl, call: projectUrl, email: projectUrl }
const now = new Date()
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000)

type Mail = { name: string; from: string; subject: string; html: string; text?: string; headers?: Record<string, string> }
const mails: Mail[] = []

mails.push({ name: 'Lead alert to developer', from: NOREPLY, subject: `Enquiry: ${PLAN} · ${PROJECT} — ${buyer.buyerName}`, html: renderLeadAlertEmailHTML({ ...buyer, projectName: PROJECT, planName: PLAN, sourceLabel: 'Enquiry', receivedAt: now, projectUrl, replyLinks, dashboardUrl }) })
mails.push({ name: 'Brochure request alert to developer', from: NOREPLY, subject: `Brochure requested, please send it: ${PROJECT} — ${buyer.buyerName}`, html: renderLeadAlertEmailHTML({ ...buyer, projectName: PROJECT, sourceLabel: 'Brochure request', receivedAt: now, brochure: { requested: true, sent: false }, projectUrl, replyLinks, dashboardUrl }) })
const notice = { ...buyer, sourceLabel: 'Enquiry', projectName: PROJECT, planName: PLAN, projectUrl, developerName: DEV, sentTo: ['sales@example.com'], receivedAt: now, dashboardUrl }
mails.push({ name: 'You got a lead (owner notice)', from: NOREPLY, subject: leadNoticeSubject(notice), html: renderLeadNoticeHTML(notice) })
for (const number of [1, 2]) {
  const input = { ...buyer, number, hoursWaiting: number === 1 ? 12 : 48, projectName: PROJECT, planName: PLAN, receivedAt: daysAgo(number === 1 ? 0.5 : 2), replyLinks, dashboardUrl }
  mails.push({ name: number === 1 ? 'Lead reminder 1 (12 hours)' : 'Lead reminder 2 (48 hours, last)', from: NOREPLY, subject: leadReminderSubject(input), html: renderLeadReminderEmailHTML(input) })
}
mails.push({ name: 'Enquiry confirmation to buyer', from: NOREPLY, subject: `Your request about ${PLAN} at ${PROJECT} was sent to ${DEV}`, html: renderLeadConfirmationEmailHTML({ ...buyer, projectName: PROJECT, planName: PLAN, projectUrl, developerName: DEV, developerPhone: '+94 11 000 0000', developerEmail: 'sales@example.com', developerWhatsAppHref: null, enquiriesUrl: `${SITE}/account` }) })
mails.push({ name: 'Brochure to buyer', from: NOREPLY, subject: `Your ${PROJECT} brochure`, html: renderBrochureEmailHTML({ projectName: PROJECT, brochureUrl: projectUrl }) })
mails.push({
  name: 'Saved search alert to buyer', from: NOREPLY, subject: 'New listings matching your saved search',
  html: renderSavedSearchAlertEmailHTML({ buyerName: 'Test Buyer', serverURL: SITE, accountUrl: `${SITE}/account`, groups: [{ searchName: 'Apartments in Colombo under Rs. 60M', matches: [{ slug: 'luxury-apartments-for-sale-in-colombo', name: PROJECT, city: 'Colombo 5', startingPriceLkr: 48_500_000 }, { slug: 'flats-for-sale-in-colombo', name: 'Sample Heights', city: 'Colombo 6', startingPriceLkr: 39_900_000 }], featured: [{ slug: 'prime-lands-apartments', name: 'Sample Featured Towers', city: 'Colombo 3', isPremium: true }] }] }),
})
mails.push({
  name: 'Follower digest to buyer', from: NOREPLY, subject: 'Updates from developers you follow',
  html: renderFollowerDigestEmailHTML({ buyerName: 'Test Buyer', serverURL: SITE, accountUrl: `${SITE}/account`, groups: [{ developerName: DEV, developerSlug: 'sample-developer', projects: [{ slug: 'luxury-apartments-for-sale-in-colombo', name: PROJECT, lines: ['Starting price changed from Rs. 50,000,000 to Rs. 48,500,000', 'New floor plan added: 3 Bedroom, Type C', 'Construction update: structure reached level 12'] }] }] }),
})
const news = await renderNewsletter({ ...SAMPLE_NEWSLETTER, email: TO })
mails.push({ name: 'Newsletter (with unsubscribe)', from: NOREPLY, subject: news.subject, html: news.html, text: news.text, headers: news.headers })

const report = {
  developerName: DEV, developerSlug: 'sample-developer', hasAccount: true, verified: false, from: daysAgo(7), to: daysAgo(1), views: 1284, previousViews: 1050, enquiries: 9, previousEnquiries: 6, waitingForReply: 3,
  listings: [{ name: PROJECT, url: projectUrl, views: 760, enquiries: 6 }, { name: 'Sample Heights', url: projectUrl, views: 402, enquiries: 2 }, { name: 'Sample Gardens (land)', url: projectUrl, views: 122, enquiries: 1, kind: 'land' as const }],
  featured: [{ label: 'Home page · Featured', impressions: 5400, clicks: 131, leads: 2 }], featuredTrial: { from: daysAgo(7), to: new Date(now.getTime() + 21 * 86_400_000) }, dashboardUrl, siteUrl: SITE,
}
mails.push({ name: 'Developer weekly report', from: DEVELOPERS, subject: developerWeeklyReportSubject(report), html: renderDeveloperWeeklyReportHTML(report) })
mails.push({ name: 'Developer invite (register and get Verified)', from: DEVELOPERS, subject: developerInviteSubject(DEV), html: renderDeveloperInviteHTML({ name: DEV, slug: 'sample-developer', projects: [PROJECT, 'Sample Heights'], lands: ['Sample Gardens'], phone: '+94 11 000 0000', email: 'sales@example.com', address: 'Colombo 5, Sri Lanka', website: 'https://example.com', autoVerify: true, leadsEmail: 'sales@example.com', missing: [{ listing: PROJECT, items: ['Handover date', 'Floor plans'] }], siteUrl: SITE }) })
mails.push({ name: 'Developer: please confirm your listings', from: DEVELOPERS, subject: `Please confirm your listings on LankaNewHomes`, html: renderDeveloperListingConfirmationEmailHTML({ developerName: DEV, contactName: 'Sample Contact', supportEmail: DEVELOPERS, listings: [{ name: PROJECT, url: projectUrl, note: 'Apartments · Published' }, { name: 'Sample Gardens', url: projectUrl, note: 'Land for sale · Pending review' }] }) })
mails.push({ name: 'Developer: you are now Verified', from: DEVELOPERS, subject: developerVerifiedSubject(DEV), html: renderDeveloperVerifiedHTML({ companyName: DEV, verifiedEmail: 'sales@example.com', profileUrl: `${SITE}/developers`, loginUrl: `${SITE}/developers/login` }) })
const missing = [{ name: PROJECT, slug: 'luxury-apartments-for-sale-in-colombo', items: ['Handover date', 'Floor plans', 'Parking', 'Brochure'] }, { name: 'Sample Heights', slug: 'flats-for-sale-in-colombo', items: ['Unit prices', 'Amenities'] }, { name: 'Sample Towers', slug: 'prime-lands-apartments', items: ['Photos', 'Total units', 'Handover date'] }]
mails.push({ name: 'Developer: missing details (3+ projects)', from: DEVELOPERS, subject: developerMissingInfoSubject(missing.length), html: renderDeveloperMissingInfoHTML({ developerName: DEV, projects: missing }) })
const outreachNames: Record<string, string> = { 'listing-update': 'Outreach: listings updated', 'verify-company': 'Outreach: verify your company', 'complete-profile': 'Outreach: complete your listings', 'lead-followup': 'Outreach: a buyer is waiting' }
for (const id of ['listing-update', 'verify-company', 'complete-profile', 'lead-followup'] as const) {
  const o = renderOutreachEmail(id, { contactName: 'Sample Contact', companyName: DEV, signName: null, projects: [{ name: PROJECT, slug: 'luxury-apartments-for-sale-in-colombo' }, { name: 'Sample Heights', slug: 'flats-for-sale-in-colombo' }], lead: { name: buyer.buyerName, email: buyer.buyerEmail, phone: buyer.buyerPhone, preferred: buyer.preferredContact, message: buyer.message, receivedAt: daysAgo(3).toISOString(), projectName: PROJECT, planName: PLAN, place: 'Colombo 5' }, link: (p) => `${SITE}${p}` })
  mails.push({ name: outreachNames[id], from: DEVELOPERS, subject: o.subject, html: o.html, text: o.text })
}
// "Sample" stands in for the one-time token, so these two buttons open the site but do not confirm or reset anything.
mails.push({ name: 'Account: confirm your email', from: NOREPLY, subject: 'Confirm your email (sample)', html: renderVerificationEmailHTML({ verificationURL: `${SITE}/developers/login`, loginURL: `${SITE}/developers/login` }) })
mails.push({ name: 'Account: reset your password', from: NOREPLY, subject: 'Reset your password (sample)', html: renderPasswordResetEmailHTML({ resetURL: `${SITE}/developers/login` }) })
mails.push({ name: 'Account: sign-in link', from: NOREPLY, subject: 'Your LankaNewHomes sign-in link (sample)', html: renderSignInLinkEmailHTML({ signInURL: `${SITE}/developers/login` }) })

const only = (process.env.ONLY ?? '').split(',').map((s) => Number(s.trim())).filter(Boolean)
let sent = 0
let failed = 0
for (const [i, m] of mails.entries()) {
  const n = i + 1
  if (only.length && !only.includes(n)) continue
  const subject = `[TEST ${n}/${mails.length}] ${m.subject}`
  if (process.env.OUT) (await import('node:fs')).writeFileSync(path.join(process.env.OUT, `${n}.html`), m.html) // with DRY=1: save the HTML to look at
  if (process.env.DRY) { console.log(`${n}. ${m.name} | from ${m.from} | ${subject} | ${m.html.length} chars`); continue }
  try {
    const res = await sendMail({ to: TO, from: m.from, replyTo: m.from, subject, html: m.html, text: m.text, headers: m.headers })
    sent++
    console.log(`OK   ${n}. ${m.name} | ${res.id}`)
  } catch (error) {
    failed++
    console.log(`FAIL ${n}. ${m.name} | ${error instanceof Error ? error.message : error}`)
  }
  await new Promise((r) => setTimeout(r, 800)) // stay under Resend's rate limit
}
console.log(`done: ${sent} sent, ${failed} failed, to ${TO}`)
process.exit(failed ? 1 : 0)

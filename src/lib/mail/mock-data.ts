import type { MailAddress, MailFolderType, ProviderAccount } from './types'

// Realistic sample mailboxes for MAIL_MOCK_MODE=true: 3 accounts, standard + custom folders, threads, attachments,
// unread/starred states and a bulk run of notification mail so pagination and the batched import can be tested.

export const MOCK_ACCOUNTS: ProviderAccount[] = [
  { zohoAccountId: '100000001', email: 'no-reply@lankanewhomes.com', displayName: 'LankaNewHomes (no-reply)' },
  { zohoAccountId: '100000002', email: 'support@lankanewhomes.com', displayName: 'LankaNewHomes Support' },
  { zohoAccountId: '100000003', email: 'developers@lankanewhomes.com', displayName: 'LankaNewHomes Developers' },
]

export type MockFolderSeed = { id: string; name: string; type: MailFolderType }

export function mockFolderSeeds(accountId: string): MockFolderSeed[] {
  const base: MockFolderSeed[] = [
    { id: `${accountId}-inbox`, name: 'Inbox', type: 'inbox' },
    { id: `${accountId}-sent`, name: 'Sent', type: 'sent' },
    { id: `${accountId}-drafts`, name: 'Drafts', type: 'drafts' },
    { id: `${accountId}-spam`, name: 'Spam', type: 'spam' },
    { id: `${accountId}-trash`, name: 'Trash', type: 'trash' },
    { id: `${accountId}-archive`, name: 'Archive', type: 'archive' },
  ]
  if (accountId === '100000002') base.push({ id: `${accountId}-buyers`, name: 'Buyers', type: 'custom' })
  if (accountId === '100000003') base.push({ id: `${accountId}-invoices`, name: 'Invoices', type: 'custom' }, { id: `${accountId}-verified`, name: 'Verified developers', type: 'custom' })
  return base
}

export type MockMessageSeed = {
  accountId: string
  folder: 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash' | 'archive' | 'buyers' | 'invoices' | 'verified'
  threadKey: string
  from: MailAddress
  to: MailAddress[]
  cc?: MailAddress[]
  subject: string
  html: string
  minutesAgo: number
  read?: boolean
  starred?: boolean
  attachments?: { filename: string; contentType: string; size: number }[]
}

const A = { noreply: '100000001', support: '100000002', developers: '100000003' }
const ME = {
  noreply: { name: 'LankaNewHomes', email: 'no-reply@lankanewhomes.com' },
  support: { name: 'LankaNewHomes Support', email: 'support@lankanewhomes.com' },
  developers: { name: 'LankaNewHomes Developers', email: 'developers@lankanewhomes.com' },
}
const p = (text: string) => `<p style="margin:0 0 12px;">${text}</p>`
const wrap = (...parts: string[]) => `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#222;">${parts.join('')}</div>`

const buyer = (name: string, email: string): MailAddress => ({ name, email })

const HANDMADE: MockMessageSeed[] = [
  // ---- support inbox / threads
  { accountId: A.support, folder: 'inbox', threadKey: 't-oceanista', from: buyer('Devika Gunawardena', 'devikag95@hotmail.com'), to: [ME.support], subject: 'Oceanista Residencies: one bedroom with a sea view?', minutesAgo: 95, read: false, html: wrap(p('Hi,'), p('I am looking for a one bedroom apartment with a sea view in Panadura. Could you tell me which units are still available and the payment plan?'), p('Thanks,<br>Devika')) },
  { accountId: A.support, folder: 'inbox', threadKey: 't-oceanista', from: ME.support, to: [buyer('Devika Gunawardena', 'devikag95@hotmail.com')], subject: 'Re: Oceanista Residencies: one bedroom with a sea view?', minutesAgo: 70, read: true, html: wrap(p('Hi Devika,'), p('Thank you for your interest. Unit A is a one bedroom of 902 sq ft. I have passed your enquiry to the developer, Odiliya Homes, who will contact you.'), p('Best regards,<br>LankaNewHomes Support')) },
  { accountId: A.support, folder: 'inbox', threadKey: 't-oceanista', from: buyer('Devika Gunawardena', 'devikag95@hotmail.com'), to: [ME.support], subject: 'Re: Oceanista Residencies: one bedroom with a sea view?', minutesAgo: 32, read: false, starred: true, html: wrap(p('Thank you! Please ask them to call me on WhatsApp after 6 pm Colombo time.')) },
  { accountId: A.support, folder: 'inbox', threadKey: 't-login', from: buyer('Nimal Perera', 'nimal.perera@gmail.com'), to: [ME.support], subject: 'I cannot log in to my account', minutesAgo: 400, read: false, html: wrap(p('Hello, I signed up yesterday but the confirmation email never arrived. Can you help?')) },
  { accountId: A.support, folder: 'inbox', threadKey: 't-land', from: buyer('Shanika Fernando', 'shanika.f@yahoo.com'), to: [ME.support], subject: 'Land for sale in Gampaha under 10 million', minutesAgo: 1500, read: true, starred: true, attachments: [{ filename: 'budget-notes.pdf', contentType: 'application/pdf', size: 84231 }], html: wrap(p('Hi team, I attached my budget notes. I am looking for a plot of at least 10 perches near Gampaha or Kadawatha.')) },
  { accountId: A.support, folder: 'inbox', threadKey: 't-review', from: buyer('Kasun Wijesinghe', 'kasun.w@outlook.com'), to: [ME.support], subject: 'How do I leave a review for a developer?', minutesAgo: 2900, read: true, html: wrap(p('Is there a way to rate a developer I bought from? I could not find the button.')) },
  { accountId: A.support, folder: 'buyers', threadKey: 't-vip', from: buyer('Rukshan Silva', 'rukshan@rsilva.lk'), to: [ME.support], subject: 'Interested in two apartments in Colombo 5', minutesAgo: 5200, read: true, html: wrap(p('We are a family office looking at two apartments. Please share floor plans and price lists.')) },
  { accountId: A.support, folder: 'sent', threadKey: 't-sent1', from: ME.support, to: [buyer('Shanika Fernando', 'shanika.f@yahoo.com')], subject: 'Re: Land for sale in Gampaha under 10 million', minutesAgo: 1400, read: true, html: wrap(p('Hi Shanika, here are three lands in Gampaha that match your budget. Let me know which you would like to visit.')) },
  { accountId: A.support, folder: 'drafts', threadKey: 't-draft1', from: ME.support, to: [buyer('Nimal Perera', 'nimal.perera@gmail.com')], subject: 'Re: I cannot log in to my account', minutesAgo: 380, read: true, html: wrap(p('Hi Nimal, I have resent the confirmation email. Please check your spam folder too.')) },
  { accountId: A.support, folder: 'spam', threadKey: 't-spam1', from: { name: 'Lottery Board', email: 'win@prizes-lk.example' }, to: [ME.support], subject: 'You have won 5,000,000 LKR!!!', minutesAgo: 3000, read: false, html: wrap(p('Click here to claim your prize now.')) },
  { accountId: A.support, folder: 'trash', threadKey: 't-trash1', from: buyer('Test Buyer', 'test@example.com'), to: [ME.support], subject: 'Test enquiry', minutesAgo: 9000, read: true, html: wrap(p('test')) },
  { accountId: A.support, folder: 'archive', threadKey: 't-arch1', from: buyer('Chamari Jayasuriya', 'chamari.j@gmail.com'), to: [ME.support], subject: 'Thank you, bought the apartment!', minutesAgo: 20000, read: true, html: wrap(p('Just wanted to say thank you. We completed the purchase last week.')) },
  // ---- developers inbox
  { accountId: A.developers, folder: 'inbox', threadKey: 't-ml', from: { name: 'Erwan', email: 'contact@maisonceylon.com' }, to: [ME.developers], subject: 'Re: Your villas and bungalow are updated on LankaNewHomes', minutesAgo: 140, read: false, starred: true, html: wrap(p('Hi Rupan, thank you for the update. The bungalow listing looks great. Could you also add our Ahangama plots?'), p('Erwan')) },
  { accountId: A.developers, folder: 'inbox', threadKey: 't-ml', from: ME.developers, to: [{ name: 'Erwan', email: 'contact@maisonceylon.com' }], subject: 'Your villas and bungalow are updated on LankaNewHomes', minutesAgo: 260, read: true, html: wrap(p('Hi Erwan, your listings are updated. Two quick next steps: verify your company and fill in the missing fields.')) },
  { accountId: A.developers, folder: 'inbox', threadKey: 't-araliya', from: { name: 'Araliya Lands', email: 'info@araliyalands.com' }, to: [ME.developers], subject: 'Block plan for Imperium Negombo', minutesAgo: 600, read: false, attachments: [{ filename: 'imperium-block-plan.jpg', contentType: 'image/jpeg', size: 1240000 }], html: wrap(p('Attached is the block plan for Imperium Negombo, Kadirana. 22 of 25 plots are available.')) },
  { accountId: A.developers, folder: 'inbox', threadKey: 't-fairway', from: { name: 'Fairway Properties', email: 'info@fairwayproperties.lk' }, to: [ME.developers], subject: 'We replied to the Fairway Latitude enquiry', minutesAgo: 1900, read: true, html: wrap(p('Thanks for the reminder. We have contacted the buyer and updated the lead status.')) },
  { accountId: A.developers, folder: 'verified', threadKey: 't-prime', from: { name: 'Prime Lands', email: 'info@primelands.lk' }, to: [ME.developers], subject: 'Verified: Prime Lands company email confirmed', minutesAgo: 7000, read: true, html: wrap(p('Our company email has been verified. Please confirm the badge shows on our profile.')) },
  { accountId: A.developers, folder: 'invoices', threadKey: 't-inv', from: { name: 'Resend Billing', email: 'billing@resend.example' }, to: [ME.developers], subject: 'Your October invoice', minutesAgo: 11000, read: true, attachments: [{ filename: 'invoice-oct.pdf', contentType: 'application/pdf', size: 51200 }], html: wrap(p('Your invoice for October is attached.')) },
  { accountId: A.developers, folder: 'sent', threadKey: 't-sent2', from: ME.developers, to: [{ name: 'Fairway Properties', email: 'info@fairwayproperties.lk' }], subject: 'A buyer is waiting for a reply about Fairway Latitude on LankaNewHomes', minutesAgo: 2100, read: true, html: wrap(p('A buyer asked about Fairway Latitude and we do not see a reply yet.')) },
  { accountId: A.developers, folder: 'drafts', threadKey: 't-draft2', from: ME.developers, to: [{ name: 'Odiliya Homes', email: 'info@odiliyahomes.lk' }], subject: 'Verify your company on LankaNewHomes', minutesAgo: 500, read: true, html: wrap(p('Hi team, confirming your company takes about a minute...')) },
  { accountId: A.developers, folder: 'spam', threadKey: 't-spam2', from: { name: 'SEO Experts', email: 'seo@rank-fast.example' }, to: [ME.developers], subject: 'Rank #1 on Google in 24 hours', minutesAgo: 4000, read: false, html: wrap(p('We can get you to the top of Google.')) },
  // ---- no-reply inbox (bounces / replies to automated mail)
  { accountId: A.noreply, folder: 'inbox', threadKey: 't-nr1', from: { name: 'Mail Delivery Subsystem', email: 'mailer-daemon@googlemail.com' }, to: [ME.noreply], subject: 'Delivery Status Notification (Failure)', minutesAgo: 210, read: false, html: wrap(p('Your message to nobody@gmial.com could not be delivered: address not found.')) },
  { accountId: A.noreply, folder: 'inbox', threadKey: 't-nr2', from: buyer('A. Buyer', 'a.buyer@gmail.com'), to: [ME.noreply], subject: 'Re: Confirm your LankaNewHomes account', minutesAgo: 800, read: false, html: wrap(p('I replied to this email by mistake. How do I confirm?')) },
  { accountId: A.noreply, folder: 'sent', threadKey: 't-nr3', from: ME.noreply, to: [buyer('New User', 'new.user@gmail.com')], subject: 'Confirm your LankaNewHomes account', minutesAgo: 900, read: true, html: wrap(p('Click the button to confirm your email address.')) },
]

// Bulk notification mail so the list has a long tail (infinite scroll, batched import).
function bulkNotifications(): MockMessageSeed[] {
  const out: MockMessageSeed[] = []
  const subjects = ['New lead: Oceanista Residencies', 'Weekly analytics digest', 'Saved search alert: 3 new listings', 'Password reset requested', 'Your listing was viewed 12 times', 'Brochure request: Fairway Latitude']
  for (let i = 0; i < 220; i += 1) {
    out.push({
      accountId: A.noreply, folder: 'inbox', threadKey: `bulk-${i}`, from: { name: 'Resend', email: 'notifications@resend.example' }, to: [ME.noreply],
      subject: `${subjects[i % subjects.length]} (#${1000 + i})`, minutesAgo: 1000 + i * 180, read: i > 6,
      html: wrap(p(`Automated notification number ${1000 + i}. Nothing needs your attention.`)),
    })
  }
  return out
}

export const MOCK_MESSAGES: MockMessageSeed[] = [...HANDMADE, ...bulkNotifications()]

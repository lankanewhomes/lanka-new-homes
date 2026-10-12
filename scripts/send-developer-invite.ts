/* eslint-disable @typescript-eslint/no-explicit-any -- one-off sender over arbitrary CMS docs */
// Sends the "register and get Verified" invite to ONE developer from developers@lankanewhomes.com (copy to developers@).
//   NODE_ENV=production npx tsx scripts/send-developer-invite.ts <developer-slug> [--to someone@company.com] [--send]
// Without --send it only writes the preview HTML and prints who it would go to. With --send it sends, then adds a "done" row to the
// CMS To-do list ("Verification invite emailed to … on …", with the Resend id) so /cms shows it was sent.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const args = process.argv.slice(2)
const slug = args[0]
const toIdx = args.indexOf('--to')
const toOverride = toIdx >= 0 ? args[toIdx + 1] : undefined
const send = args.includes('--send')
if (!slug) throw new Error('Usage: send-developer-invite.ts <developer-slug> [--to email] [--send]')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { buildInviteInput } = await import('../src/lib/developer-invite-data')
const { renderDeveloperInviteHTML, developerInviteSubject } = await import('../src/lib/developer-invite-email')
const { checkEmailAgainstWebsite } = await import('../src/lib/developer-domain-verification')
const { sendMail } = await import('../src/lib/mailer')
const payload = await getPayload({ config: cfg })
const dev: any = (await payload.find({ collection: 'developers', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
if (!dev) throw new Error(`No developer ${slug}`)
const input = await buildInviteInput(payload, dev)
const to = toOverride ?? dev.contact_email
if (!to) throw new Error('No recipient: pass --to')
if (toOverride) {
  input.verifyEmail = toOverride
  input.autoVerify = checkEmailAgainstWebsite(toOverride, dev.website, dev.extra_email_domains).ok
}
const html = renderDeveloperInviteHTML(input)
const subject = developerInviteSubject(dev.name)
const dir = path.join(os.homedir(), 'Desktop', 'Stuff - LankaNewHomes', 'LankaNewHomes Developer Emails')
fs.mkdirSync(dir, { recursive: true })
const file = path.join(dir, `${slug}${toOverride ? '-to-' + toOverride.split('@')[0] : ''}.html`)
fs.writeFileSync(file, html)
console.log({ to, subject, autoVerify: input.autoVerify, missingListings: input.missing?.length ?? 0, preview: file })
if (!send) { console.log('Dry run: nothing sent. Add --send to send.'); process.exit(0) }
const result = await sendMail({ from: 'LankaNewHomes <developers@lankanewhomes.com>', to, bcc: 'developers@lankanewhomes.com', replyTo: 'developers@lankanewhomes.com', subject, html, text: `Your ${dev.name} page is live on LankaNewHomes. Register and get Verified: https://www.lankanewhomes.com/developers/register` })
console.log('SENT, Resend id:', result.id)
await payload.create({ collection: 'listing-todos' as never, overrideAccess: true, data: {
  title: `Verification invite emailed to ${to} on ${new Date().toISOString().slice(0, 10)}`, listingType: 'other', listingName: dev.name, done: true,
  notes: `Sent from developers@lankanewhomes.com (copy to developers@). Resend id ${result.id}. Check delivery with: NODE_ENV=production npx tsx scripts/check-invite-status.ts ${result.id}. Clicks show in Google Analytics as source "developer-invite", content "${slug}".`,
  sourceLinks: `https://www.lankanewhomes.com/developers/${slug}`,
} as never })
process.exit(0)

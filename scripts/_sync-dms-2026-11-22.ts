/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the Instagram message sent to Maison Ceylon Real Estate (developer 23) on 2026-11-22 at 9:50 AM Toronto time (14:50 UTC),
// read from the Instagram inbox thread the owner pointed to. All three messages in the thread are ours; Maison Ceylon has not replied
// (only a heart on the Villa Senehasa post we shared on 2026-10-20). Adds one contactLog entry; skips if that entry is already there.
//   NODE_ENV=production npx tsx scripts/_sync-dms-2026-11-22.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })

const THREAD = 'https://www.instagram.com/direct/t/18104302108817874/'
const SENT_AT = '2026-11-22T14:50:00.000Z'
const dev: any = await payload.findByID({ collection: 'developers', id: 23, depth: 0, overrideAccess: true })
console.log('developer', dev.id, dev.name)
const log: any[] = (dev.contactLog || []).map((c: any) => ({ channel: c.channel, date: c.date, summary: c.summary, link: c.link }))
console.log('existing instagram entries:', log.filter((c) => c.channel === 'instagram').map((c) => `${c.date} ${String(c.summary).slice(0, 70)}`))
if (log.some((c) => c.channel === 'instagram' && String(c.date).slice(0, 16) === SENT_AT.slice(0, 16))) {
  console.log('already logged')
  process.exit(0)
}
log.push({
  channel: 'instagram',
  date: SENT_AT,
  summary: 'Instagram message (sent): told them all four projects (Villa Sahana, Villa Senehasa, Villa Samagi, Bungalow Ithiri) are now on Featured listings free of charge, and that they can follow results in the developer dashboard (www.lankanewhomes.com/developers/login): Analytics for views and enquiries per project, Featured > Monthly report for shown, clicked and leads. Offered help with updates or logging in. No reply from Maison Ceylon in this thread yet (only a heart on the Villa Senehasa post shared 20 Oct).',
  link: THREAD,
})
await payload.update({ collection: 'developers', id: 23, data: { contactLog: log } as any, overrideAccess: true })
console.log('logged 1 entry on developer 23, total', log.length)
process.exit(0)

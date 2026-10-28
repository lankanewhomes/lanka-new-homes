/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the Instagram DM thread with Home Lands (developer 16, project Diamond Tower id 150) in the developer's contactLog.
// Read from the Instagram / Meta Business Suite inbox on 2026-10-27; Maison Ceylon and Fairway were already logged.
//   NODE_ENV=production npx tsx scripts/_sync-dms-2026-10-27.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })

const THREAD = 'https://www.instagram.com/direct/t/119764602748067/'
const dev: any = await payload.findByID({ collection: 'developers', id: 16, depth: 0, overrideAccess: true })
const log: any[] = (dev.contactLog || []).map((c: any) => ({ channel: c.channel, date: c.date, summary: c.summary, link: c.link }))
if (log.some((c) => c.link === THREAD)) {
  console.log('already logged')
  process.exit(0)
}
log.push(
  { channel: 'instagram', date: '2026-10-28T00:47:00.000Z', summary: 'Instagram message (sent): asked them to share more on Diamond Tower (pricing, floor plans, expected completion date, brochures, photos or videos), with the listing preview link https://www.lankanewhomes.com/listing-preview/diamond-tower.', link: THREAD },
  { channel: 'instagram', date: '2026-10-28T00:48:00.000Z', summary: 'Instagram reply (received, looks automatic): asked us to share contact details for a call back, and gave WhatsApp https://wa.me/94710299444. No details about Diamond Tower yet.', link: THREAD },
)
await payload.update({ collection: 'developers', id: 16, data: { contactLog: log } as any, overrideAccess: true })
console.log('logged 2 entries on developer 16, total', log.length)
process.exit(0)

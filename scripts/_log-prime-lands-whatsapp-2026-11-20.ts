/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the WhatsApp message the owner sent to Prime Lands (developer 6) on 2026-11-20, covering 9 unanswered leads
// (29, 30, 31, 32 Elemint Suites + Viva La Vida; 74, 75 J'Adore Negombo; 54 The Sequor; 80 Gloria Stage II; 85 Novara).
// Adds an outbound row to whatsapp-messages (shows in /dashboard/whatsapp) and a contactLog entry on the developer. Lead status is not changed.
//   NODE_ENV=production npx tsx scripts/_log-prime-lands-whatsapp-2026-11-20.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import pg from 'pg'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const SENT_AT = '2026-11-20T17:18:00.000Z'
const PHONE = '94112030800'
const LINK = `https://wa.me/${PHONE}`
const TEXT = `Hi, this is LankaNewHomes. We hope you're well.

These buyer enquiries sent through our site have not had a reply yet. Could you please contact them today and send us a quick reply when done?

1) Elemint Suites Gampaha - https://www.lankanewhomes.com/projects/elemint-suites-gampaha - Don Wanigasundara, +1 240 413 3728, samappriya@gmail.com (3 enquiries, 15 Sep 2026)
2) Viva La Vida Kottawa - https://www.lankanewhomes.com/projects/viva-la-vida - same buyer (15 Sep 2026)
3) J'Adore Negombo - https://www.lankanewhomes.com/projects/j-adore-negombo - Prashanth, +41 79 701 4112, prashanthvp@hotmail.com, plus +41 79 702 4223 (11 Nov 2026)
4) The Sequor Gampaha - https://www.lankanewhomes.com/land/the-sequor-gampaha - Lanor Kasun, +33 7 81 72 60 92, lenor26kasun@yahoo.com (4 Nov 2026)
5) Gloria Stage II Ahangama - https://www.lankanewhomes.com/land/gloria-stage-ii-ahangama - Stephen Orr, +44 7797 777227 (13 Nov 2026)
6) Novara Kadawatha - https://www.lankanewhomes.com/land/novara-kadawatha - Nakin, +81 80 4465 8182 (16 Nov 2026)

Thank you for your help,
Rupan
LankaNewHomes | Find new homes and land in Sri Lanka
https://www.lankanewhomes.com`

const client = new pg.Client({ connectionString: process.env.DATABASE_URI })
await client.connect()
const dup = await client.query("select id from payload.whatsapp_messages where phone=$1 and message_type='text' and direction='outbound' and sent_at=$2", [PHONE, SENT_AT])
if (dup.rows.length) console.log('message row already logged', dup.rows[0].id)
else {
  const r = await client.query("insert into payload.whatsapp_messages (direction, phone, text, message_type, status, developer_id, lead_id, sent_at) values ('outbound',$1,$2,'text','sent',6,29,$3) returning id", [PHONE, TEXT, SENT_AT])
  console.log('inserted whatsapp message', r.rows[0].id)
}
await client.end()

const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const dev: any = await payload.findByID({ collection: 'developers', id: 6, depth: 0, overrideAccess: true })
const log: any[] = (dev.contactLog || []).map((c: any) => ({ channel: c.channel, date: c.date, summary: c.summary, link: c.link }))
if (log.some((c) => c.channel === 'whatsapp' && c.date === SENT_AT)) console.log('contactLog already has it')
else {
  log.push({ channel: 'whatsapp', date: SENT_AT, summary: 'WhatsApp message (sent) to +94 11 20 30 800: listed 9 unanswered buyer enquiries (leads 29, 30, 31, 32, 54, 74, 75, 80, 85 across Elemint Suites Gampaha, Viva La Vida Kottawa, J\'Adore Negombo, The Sequor Gampaha, Gloria Stage II Ahangama, Novara Kadawatha) and asked for a reply today. Delivered, no reply yet.', link: LINK })
  await payload.update({ collection: 'developers', id: 6, data: { contactLog: log } as any, overrideAccess: true })
  console.log('logged contactLog entry on developer 6, total', log.length)
}
process.exit(0)

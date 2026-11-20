/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Logs the WhatsApp message the owner sent to Crystal Property Group (developer 38) on 2026-11-20 at 12:34 PM (17:34 UTC), seen as the last message in WhatsApp Web:
// two unanswered leads (76 Dunith, Crystal Sands Sky Villas; 89 Harshamal Gunawardana, Mantra Kandy). No reply from Crystal in the chat.
// Adds an outbound row to whatsapp-messages (shows in /dashboard/whatsapp) and a contactLog entry on the developer. Lead status is not changed.
//   NODE_ENV=production npx tsx scripts/_log-crystal-whatsapp-2026-11-20.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import pg from 'pg'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const SENT_AT = '2026-11-20T17:34:00.000Z'
const PHONE = '94772292202'
const LINK = `https://wa.me/${PHONE}`
// No buyer contact details are written in this file: the lead block is built from payload.leads at run time (only the developer's own leads, 76 and 89).
const fmtPhone = (p: string | null) => { const d = (p ?? '').replace(/\D/g, ''); return d.startsWith('94') && d.length === 11 ? `+94 ${d.slice(2, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : d.length === 9 ? `+94 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}` : (p ?? '') }
const client = new pg.Client({ connectionString: process.env.DATABASE_URI })
await client.connect()
const leads = (await client.query("select id, name, phone, email, preferred_contact_method, message from payload.leads where id in (76, 89) order by id")).rows
const L76 = leads.find((l: any) => l.id === 76)
const L89 = leads.find((l: any) => l.id === 89)
const TEXT = `Hi, this is LankaNewHomes. We hope you're well. Two buyers asked about your projects on LankaNewHomes and haven't had a reply yet.

Crystal Sands Sky Villas
https://www.lankanewhomes.com/projects/crystal-sands-sky-villas
Name: ${L76.name}
Phone: ${fmtPhone(L76.phone)}
Email: ${L76.email}
Preferred contact: phone call
Enquiry: brochure request for the Surf Suite, 3 bed, 1,456 SqFt
Received: 12 Nov through your listing on LankaNewHomes

Mantra Kandy
https://www.lankanewhomes.com/projects/mantra-kandy
Name: ${L89.name}
Phone: ${fmtPhone(L89.phone)}
Preferred contact: WhatsApp
Enquiry: would like more details about Mantra Kandy
Received: 19 Nov through your listing on LankaNewHomes

We emailed both enquiries to sales@cpg.lk (Dunith on 12 Nov, with reminders on 13 and 14 Nov; Harshamal on 19 Nov, with a reminder on 20 Nov). Could you please contact them today and send the brochure and details? A quick reply here once it's done would help us keep them updated.

Thank you for your help,
Rupan
LankaNewHomes | Find new homes and land in Sri Lanka
https://www.lankanewhomes.com`

const dup = await client.query("select id from payload.whatsapp_messages where phone=$1 and message_type='text' and direction='outbound' and sent_at=$2", [PHONE, SENT_AT])
if (dup.rows.length) console.log('message row already logged', dup.rows[0].id)
else {
  const r = await client.query("insert into payload.whatsapp_messages (direction, phone, text, message_type, status, developer_id, lead_id, sent_at) values ('outbound',$1,$2,'text','sent',38,76,$3) returning id", [PHONE, TEXT, SENT_AT])
  console.log('inserted whatsapp message', r.rows[0].id)
}
await client.end()

const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const dev: any = await payload.findByID({ collection: 'developers', id: 38, depth: 0, overrideAccess: true })
const log: any[] = (dev.contactLog || []).map((c: any) => ({ channel: c.channel, date: c.date, summary: c.summary, link: c.link }))
if (log.some((c) => c.channel === 'whatsapp' && c.date === SENT_AT)) console.log('contactLog already has it')
else {
  log.push({ channel: 'whatsapp', date: SENT_AT, summary: 'WhatsApp message (sent) to +94 77 229 2202: listed 2 unanswered buyer enquiries (lead 76 Dunith, Crystal Sands Sky Villas, brochure request 12 Nov; lead 89 Harshamal Gunawardana, Mantra Kandy, 19 Nov) and the emails sent to sales@cpg.lk. No reply in the WhatsApp chat yet.', link: LINK })
  await payload.update({ collection: 'developers', id: 38, data: { contactLog: log } as any, overrideAccess: true })
  console.log('logged contactLog entry on developer 38, total', log.length)
}
process.exit(0)

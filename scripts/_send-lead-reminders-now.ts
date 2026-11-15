/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Manual reminder send, asked for by the owner (first used 2026-11-15, a Sunday evening in Sri Lanka, when the automatic sweep is paused).
// Sends the NEXT reminder to the developer for each lead id given, and records reminder_count / last_reminder_at on the lead in the
// backend. All the usual guards stay on: still "New", not answered, two reminders at most, never twice within 6 hours.
//   NEXT_PUBLIC_SITE_URL=https://www.lankanewhomes.com NEXT_PUBLIC_SERVER_URL=https://www.lankanewhomes.com LEAD_ALERTS_LIVE=true NODE_ENV=production npx tsx scripts/_send-lead-reminders-now.ts 79 80 81 [--send]
// Without --send it only lists what would go out.
// Lessons from 2026-11-15 (leads 79, 80, 81): (1) NEXT_PUBLIC_SITE_URL must be the live site too, or the tracked links in the email (View in
// dashboard, footer) point at localhost; the reply buttons were fine. (2) Run it from a tree that matches cloudflare-migration: an older
// Leads collection refused the reminder_count update (email was still required), so the count had to be written by hand afterwards.
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const ids = process.argv.slice(2).filter((a) => /^\d+$/.test(a)).map(Number)
if (!ids.length) { console.log('give lead ids'); process.exit(1) }
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
if (!String(payload.config.serverURL).startsWith('https://www.lankanewhomes.com') || !String(process.env.NEXT_PUBLIC_SITE_URL).startsWith('https://www.lankanewhomes.com')) { console.log('set NEXT_PUBLIC_SERVER_URL and NEXT_PUBLIC_SITE_URL to the live site first, links would be wrong'); process.exit(1) }
const { sendLeadReminders } = await import('../src/lib/lead-reminders')
const out = await sendLeadReminders(payload, { enabled: process.argv.includes('--send'), onlyIds: ids })
console.log(JSON.stringify(out, null, 1))
process.exit(0)

// Shows what happened to an email we sent through Resend (delivered, bounced, complained, opened, clicked when tracking is on).
//   npx tsx scripts/check-invite-status.ts <resend-email-id>
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const id = process.argv[2]
if (!id) throw new Error('Usage: check-invite-status.ts <resend-email-id>')
const key = process.env.RESEND_API_KEY || process.env.SMTP_PASS
const r = await fetch(`https://api.resend.com/emails/${id}`, { headers: { Authorization: `Bearer ${key}` } })
const d = (await r.json()) as any
console.log({ to: d.to, subject: d.subject, created_at: d.created_at, last_event: d.last_event })
process.exit(0)

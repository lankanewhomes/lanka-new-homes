// Sends ONE test copy of a rendered developer weekly report to the owner only (owner, 2026-11-22: "send me a test email to me").
// Never sends to a developer: TO is fixed to the owner's Gmail. From developers@lankanewhomes.com.
//   HTML=<rendered .html from preview-developer-weekly-report-email.ts> SUBJECT="..." npx tsx scripts/send-weekly-report-test-email.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const { sendMail } = await import('../src/lib/mailer')
const file = process.env.HTML
if (!file) throw new Error('Set HTML')
const TO = 'lankanewhomes@gmail.com'
const res = await sendMail({ to: TO, from: 'developers@lankanewhomes.com', replyTo: 'developers@lankanewhomes.com', subject: `[TEST] ${process.env.SUBJECT ?? 'Your week on LankaNewHomes'}`, html: fs.readFileSync(file, 'utf8') })
console.log('sent to', TO, 'id', res.id)
process.exit(0)

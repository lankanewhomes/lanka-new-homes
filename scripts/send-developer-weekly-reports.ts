// Sends rendered developer weekly reports (from scripts/preview-developer-weekly-report-email.ts) to the developers' own addresses, from
// developers@lankanewhomes.com. Owner approved the first run on 2026-11-22 ("send it out") for the top 5 developers by views.
// Each line of LIST is "<html file>|<to address>|<subject>". Sends one at a time and stops on the first failure. DRY_RUN=1 only prints.
//   LIST=<file> [DRY_RUN=1] npx tsx scripts/send-developer-weekly-reports.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const { sendMail } = await import('../src/lib/mailer')
const listFile = process.env.LIST
if (!listFile) throw new Error('Set LIST')
const FROM = 'developers@lankanewhomes.com'
for (const line of fs.readFileSync(listFile, 'utf8').split('\n').filter((l) => l.trim())) {
  const [file, to, subject] = line.split('|')
  if (!file || !to?.includes('@') || !subject) throw new Error(`Bad line: ${line}`)
  const html = fs.readFileSync(file, 'utf8')
  if (process.env.DRY_RUN) { console.log('DRY', to, '|', subject, '|', html.length, 'bytes'); continue }
  const res = await sendMail({ to, from: FROM, replyTo: FROM, subject, html })
  console.log('sent', to, res.id)
}
process.exit(0)

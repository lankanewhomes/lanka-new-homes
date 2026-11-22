// Preview of the developer weekly report email. READ ONLY: sends nothing, writes nothing to the database.
// Uses the same builder as the Sunday send (src/lib/developer-weekly-report.ts). Writes one HTML file per developer (TOP limits how many).
//   OUT_DIR=<folder> [TOP=5] [DEVELOPER_SLUG=<slug>] [NOW=2026-11-22] npx tsx scripts/preview-developer-weekly-report-email.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const payload = await (await import('payload')).getPayload({ config: ((await import('../payload.config')) as any).default })
const { buildDeveloperWeeklyReports } = await import('../src/lib/developer-weekly-report')
const { renderDeveloperWeeklyReportHTML } = await import('../src/lib/developer-weekly-report-email')
const OUT = process.env.OUT_DIR
if (!OUT) throw new Error('Set OUT_DIR')
let reports = await buildDeveloperWeeklyReports(payload, process.env.NOW ? new Date(process.env.NOW) : new Date())
console.log('developers with activity:', reports.length, '| without an email:', reports.filter((r) => !r.to).length)
if (process.env.DEVELOPER_SLUG) reports = reports.filter((r) => r.slug === process.env.DEVELOPER_SLUG)
else if (process.env.TOP) reports = reports.slice(0, Number(process.env.TOP))
fs.mkdirSync(OUT, { recursive: true })
reports.forEach((r, i) => {
  fs.writeFileSync(`${OUT}/${i + 1}-${r.slug}.html`, renderDeveloperWeeklyReportHTML(r.input))
  console.log(JSON.stringify({ rank: i + 1, slug: r.slug, to: r.to, subject: r.subject, waiting: r.input.waitingForReply, account: r.input.hasAccount, verified: r.input.verified, listings: r.input.listings.length, featured: r.input.featured }))
})
process.exit(0)

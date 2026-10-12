/* eslint-disable @typescript-eslint/no-explicit-any */
// Renders the developer "register and get Verified" email as local HTML files, one per developer. Does NOT send anything.
// Output goes outside the repo (the repo is public and the files hold contact details).
//   NODE_ENV=production npx tsx scripts/generate-developer-invite-emails.ts [out-dir]
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const out = process.argv[2] ?? path.join(os.homedir(), 'Desktop', 'LankaNewHomes Developer Emails')
fs.mkdirSync(out, { recursive: true })
const { renderDeveloperInviteHTML, developerInviteSubject } = await import('../src/lib/developer-invite-email')
const { buildInviteInput } = await import('../src/lib/developer-invite-data')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const devs = await payload.find({ collection: 'developers', limit: 500, depth: 0, pagination: false, overrideAccess: true })
const index: string[] = []
for (const d of devs.docs as any[]) {
  if (String(d.slug).startsWith('test-badge-')) continue
  const input = await buildInviteInput(payload, d)
  const html = renderDeveloperInviteHTML(input)
  fs.writeFileSync(path.join(out, `${d.slug}.html`), html)
  index.push(`${d.slug} | to: ${d.contact_email ?? '(no email on file)'} | subject: ${developerInviteSubject(d.name)} | ${input.projects.length} projects, ${input.lands.length} lands, ${input.missing?.length ?? 0} listings with missing details`)
}
fs.writeFileSync(path.join(out, 'INDEX.txt'), index.join('\n') + '\n')
console.log(index.join('\n'))
process.exit(0)

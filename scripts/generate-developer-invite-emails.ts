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
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const devs = await payload.find({ collection: 'developers', limit: 500, depth: 0, pagination: false, overrideAccess: true })
const index: string[] = []
for (const d of devs.docs as any[]) {
  if (String(d.slug).startsWith('test-badge-')) continue
  const projects = (await payload.find({ collection: 'projects', where: { developer: { equals: d.id } }, limit: 200, depth: 0, pagination: false, overrideAccess: true })).docs as any[]
  const lands = (await payload.find({ collection: 'lands', where: { sellerName: { equals: d.name } } as any, limit: 500, depth: 0, pagination: false, overrideAccess: true })).docs as any[]
  // Only what is live on the site (drafts have isPublished === false).
  const live = (x: any) => x.isPublished !== false
  const html = renderDeveloperInviteHTML({ name: d.name, slug: d.slug, projects: projects.filter(live).map((p) => p.name), lands: lands.filter(live).map((l) => l.title ?? l.name), phone: d.contact_phone, email: d.contact_email, address: d.location, website: d.website })
  fs.writeFileSync(path.join(out, `${d.slug}.html`), html)
  index.push(`${d.slug} | to: ${d.contact_email ?? '(no email on file)'} | subject: ${developerInviteSubject(d.name)} | ${projects.filter(live).length} projects, ${lands.filter(live).length} lands`)
}
fs.writeFileSync(path.join(out, 'INDEX.txt'), index.join('\n') + '\n')
console.log(index.join('\n'))
process.exit(0)

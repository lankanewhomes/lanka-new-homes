/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Owner request 2026-11-15: fill in the Grand Apartments Group developer profile (logo, contacts, social, hours, about) from grandapartments.lk
// and publish the 9 current (non-sold-out) Grand projects, ids 180-188. Awards: the site lists none. Sold-out completed projects stay out.
//   NODE_ENV=production npx tsx scripts/update-grand-apartments-developer-and-publish.ts [--apply]
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const apply = process.argv.includes('--apply')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const dev: any = (await payload.find({ collection: 'developers', where: { slug: { equals: 'grand-apartments-group' } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
if (!dev) throw new Error('developer missing')
let logo = dev.logo
if (!logo) {
  const res = await fetch('https://grandapartments.lk/wp-content/uploads/2025/06/GA-Logo-01.png')
  if (!res.ok) throw new Error('logo fetch ' + res.status)
  logo = apply ? await mirrorToR2('logos/developers/grand-apartments-group-logo.png', Buffer.from(await res.arrayBuffer()), 'image/png') : '(would upload logo)'
}
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const data: Record<string, any> = {
  logo,
  description: 'Grand Apartments Group is a Sri Lankan property developer building well-designed, value-driven apartment towers in Colombo and Dehiwala. It says it has delivered over 400 homes, with 8 completed projects, and focuses on smart use of space, functional layouts and dependable delivery. Current projects: Grand Legacy, Central, Heights, Oasis, Peak, Court, Edge, Sky and Capital.',
  contact_email: 'info@grandapartments.lk',
  contact_phone: '+94776202088',
  location: '34 27th Lane, Colombo 03',
  socialLinks: { ...(dev.socialLinks ?? {}), facebook: 'https://www.facebook.com/Grandapartmentslk/', instagram: 'https://www.instagram.com/grandapartmentslk/', whatsapp: '+94776202088' },
  officeHours: [...days.map((day) => ({ day, open: true, from: '10:00 am', to: '07:00 pm' })), { day: 'Sunday', open: false }],
  siteStats: { ...(dev.siteStats ?? {}), completed: '8' },
}
delete (data.socialLinks as any).id
// Backend-only reference links (admin Links tab) so we can re-check the developer's site for new listings and updated info later.
const note = 'Checked 2026-11-15. Re-check for new or changed listings.'
const have = new Set<string>((dev.referenceLinks ?? []).map((l: any) => l.url))
const refs = [
  ['Developer site (home)', 'https://grandapartments.lk/'], ['All projects page', 'https://grandapartments.lk/projects/'], ['About us', 'https://grandapartments.lk/about-us/'],
  ['Contact', 'https://grandapartments.lk/contact-us/'], ['Announcements (awards/news; empty on 2026-11-15)', 'https://grandapartments.lk/announcements/'],
  ['Facebook', 'https://www.facebook.com/Grandapartmentslk/'], ['Instagram', 'https://www.instagram.com/grandapartmentslk/'],
  ...['avenue', 'square', 'tower', 'homes', 'view', 'park', 'residences', 'apartments'].map((x) => [`Sold out, NOT listed: Grand ${x[0].toUpperCase() + x.slice(1)}`, `https://grandapartments.lk/listing/grand-${x}/`]),
].filter(([, url]) => !have.has(url)).map(([label, url]) => ({ label, url, note: label.startsWith('Sold out') ? 'Sold Out tag on 2026-11-15; owner: do not add sold-out. Re-check only for new units.' : note }))
data.referenceLinks = [...(dev.referenceLinks ?? []).map((l: any) => ({ label: l.label, url: l.url, note: l.note })), ...refs]
console.log('developer', dev.id, JSON.stringify({ ...data, logo: String(logo).slice(0, 90) }).slice(0, 900))
if (apply) await payload.update({ collection: 'developers', id: dev.id, data: data as never, overrideAccess: true })
const slugs = ['legacy-colombo-03', 'central-colombo-03', 'heights-colombo-04', 'oasis-colombo-13', 'peak-dehiwala', 'court-colombo-14', 'edge-colombo-06', 'sky-colombo-06', 'capital-colombo-09'].map((s) => 'grand-' + s)
for (const slug of slugs) {
  const p: any = (await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!p) { console.log('MISSING', slug); continue }
  console.log(p.id, slug, 'isPublished', p.isPublished)
  const links = (p.referenceLinks ?? []).map((l: any) => ({ label: l.label, url: l.url, note: l.note }))
  if (p.sourceUrl && !links.some((l: any) => l.url === p.sourceUrl)) links.push({ label: 'Developer listing page', url: p.sourceUrl, note })
  if (apply) await payload.update({ collection: 'projects', id: p.id, data: { isPublished: true, publishedAt: p.publishedAt ?? new Date().toISOString(), referenceLinks: links } as never, overrideAccess: true })
}
console.log(apply ? 'APPLIED' : 'DRY RUN')
process.exit(0)

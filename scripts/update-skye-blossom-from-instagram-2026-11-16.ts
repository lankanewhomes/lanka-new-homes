/* eslint-disable @typescript-eslint/no-explicit-any -- one-off update script */
// Skye Blossom Kottawa (Prime Lands, "Future Lifestyle Apartments" advert): ADD-ONLY update from the developer's Instagram post of 10 Nov 2026 (owner message 2026-11-16).
// Adds the monthly instalment and down payment lines, the price note, the amenities the post lists and both post links as backend reference links. Nothing is removed.
// The Facebook video link could not be read (login wall), so nothing was taken from it.
//   NODE_ENV=production npx tsx scripts/update-skye-blossom-from-instagram-2026-11-16.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload: any = await getPayload({ config: cfg })
const p: any = (await payload.find({ collection: 'projects', where: { slug: { equals: 'skye-blossom-kottawa' } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
if (!p) throw new Error('project missing')
const IG = 'https://www.instagram.com/p/DflhN8bjOcp/'
const FB = 'https://www.facebook.com/share/v/1da1gE5Lcu/'
if ((p.referenceLinks ?? []).some((l: any) => l.url === IG)) { console.log('already updated'); process.exit(0) }
const add = (arr: any[], line: string) => (arr.includes(line) ? arr : [...arr, line])
const have = new Set((p.amenities ?? []).map((a: any) => a.name))
const newAmen = [
  ['Resident Lounge', 'Landscaped resident lounge.'],
  ["Children's Area", "Children's outdoor play area."],
  ['Parking', 'Ample parking facilities.'],
  ['Security', '24-hour security and access control.'],
].filter(([n]) => !have.has(n)).map(([name, description]) => ({ name, description }))
const clean = (a: any[]) => (a ?? []).map((x: any) => { const { id: _i, ...r } = x; return r })
const upd: Record<string, any> = {
  paymentPlanItems: ['Down payment: LKR 9 million', 'Monthly instalments from LKR 250,000'].reduce(add, p.paymentPlanItems ?? []),
  pricingNotes: add(p.pricingNotes ?? [], 'Prices starting from LKR 50 million (developer Instagram post, 10 November 2026).'),
  amenities: [...clean(p.amenities), ...newAmen],
  referenceLinks: [
    ...clean(p.referenceLinks),
    { label: 'Developer Instagram post (Future Lifestyle Apartments, Kottawa)', url: IG, note: 'Read 2026-11-16: from LKR 50M, down payment LKR 9M, monthly from LKR 250,000, 3-bed 1,375 sq ft, amenities. Check for newer posts.' },
    { label: 'Developer Facebook video', url: FB, note: 'Shared by the owner 2026-11-16; needs a login to read, not used yet.' },
  ],
}
await payload.update({ collection: 'projects', id: p.id, data: upd, overrideAccess: true })
const a: any = await payload.findByID({ collection: 'projects', id: p.id, depth: 0, overrideAccess: true })
console.log('updated', a.slug, '| published', a.isPublished, '| payment lines', a.paymentPlanItems?.length, '| amenities', (a.amenities ?? []).map((x: any) => x.name).join(', '), '| links', a.referenceLinks?.length)
process.exit(0)

/* eslint-disable @typescript-eslint/no-explicit-any -- one-off update script */
// Venezia Negombo (Prime Lands / Prime Group): update from the developer's advert text pasted by the owner on 2026-11-16, plus the phone the owner chose
// (+94 11 203 0800, the WhatsApp number from the advert link). Add-only except the phone, which replaces 070 40 111 00 at the owner's instruction.
//   NODE_ENV=production npx tsx scripts/update-venezia-negombo-2026-11-16.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload: any = await getPayload({ config: cfg })
const p: any = (await payload.find({ collection: 'projects', where: { slug: { equals: 'venezia-negombo' } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
if (!p) throw new Error('project missing')
if (p.contact?.phone === '+94 11 203 0800') { console.log('already updated'); process.exit(0) }
const clean = (a: any[]) => (a ?? []).map((x: any) => { const { id: _i, ...r } = x; return r })
const addLine = (arr: string[], line: string) => (arr.includes(line) ? arr : [...arr, line])
const desc: Record<string, string> = {
  Jacuzzi: 'Fitted Jacuzzi in the spacious 2-bedroom apartments.',
  Cafe: 'Coffee stops, gelato corners and more.',
  Pavilion: 'Glass gazebos for cocktails and intimate gatherings.',
  'Lake View': 'Shared and private balconies overlooking the Negombo Lagoon.',
}
const amen = clean(p.amenities).map((a: any) => (desc[a.name] && !a.description ? { ...a, description: desc[a.name] } : a))
if (!amen.some((a: any) => a.name === 'Restaurant')) amen.push({ name: 'Restaurant', description: 'French and Italian restaurants.' })
const haveNear = new Set((p.nearby ?? []).map((n: any) => n.name))
const near = [
  ['Katunayake Expressway (4 minutes)', 'Transport'],
  ['Bandaranaike International Airport (5 minutes)', 'Transport'],
  ['Negombo Beach (10 minutes)', 'Landmark'],
  ['Colombo Port City (20 minutes)', 'Landmark'],
  ['Colombo-Negombo Main Road (walking distance)', 'Transport'],
].filter(([n]) => !haveNear.has(n)).map(([name, category]) => ({ name, category }))
const upd: Record<string, any> = {
  contact: { ...(p.contact ?? {}), phone: '+94 11 203 0800' },
  reservationFee: 'LKR 1,000,000 reservation fee',
  pricingNotes: addLine(p.pricingNotes ?? [], 'Starting from LKR 60 million upwards (developer advert, November 2026).'),
  highlights: addLine(p.highlights ?? [], 'Overlooking the Negombo Lagoon, 10 minutes to Negombo Beach and 20 minutes to Colombo Port City'),
  amenities: amen,
  nearby: [...clean(p.nearby), ...near],
}
await payload.update({ collection: 'projects', id: p.id, data: upd, overrideAccess: true })
const a: any = await payload.findByID({ collection: 'projects', id: p.id, depth: 0, overrideAccess: true })
console.log('updated', a.slug, '| published', a.isPublished, '| phone', a.contact?.phone, '| reservation', a.reservationFee, '| amenities', (a.amenities ?? []).map((x: any) => x.name).join(', '), '| nearby', (a.nearby ?? []).length)
process.exit(0)

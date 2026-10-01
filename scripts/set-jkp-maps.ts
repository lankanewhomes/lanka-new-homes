// Map coordinates for the John Keells Properties listings (their pages publish none).
// Looked up with OpenStreetMap Nominatim (© OpenStreetMap contributors, ODbL):
//  - Cinnamon Life: the OSM node on Glenie (Glennie) Street, Colombo 2
//  - Vauxhall DSTRCT / TRI-ZEN: the street segments named in their addresses (Vauxhall Street /
//    Union Place) — street-level, not the exact plot
//  - Ridgeview: Victoria Golf & Country Resort (plots are inside the resort)
//  - VIMAN: only the Ja-Ela town centre resolves — an approximate area pin
// Also puts Cinnamon Life's "Available plan prices" on separate lines (owner, 2026-10-01).
//
//   NODE_ENV=production npx tsx scripts/set-jkp-maps.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

const PROJECTS: Record<string, { lat: number; lng: number; sv: boolean }> = {
  'cinnamon-life-apartments': { lat: 6.9252122, lng: 79.8490506, sv: true },
  'vauxhall-dstrct': { lat: 6.9229946, lng: 79.8574445, sv: true },
  'tri-zen-apartments': { lat: 6.9216416, lng: 79.8552578, sv: true },
  'viman-ja-ela-apartments': { lat: 7.0793775, lng: 79.8907632, sv: false },
}
for (const [slug, c] of Object.entries(PROJECTS)) {
  const r = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  const d = r.docs[0] as unknown as { id: number; availablePlanPrices?: string }
  if (!d) { console.log('MISSING', slug); continue }
  const data: Record<string, unknown> = { coordinates: { lat: c.lat, lng: c.lng, streetViewAvailable: c.sv } }
  if (d.availablePlanPrices?.includes(' | ')) data.availablePlanPrices = d.availablePlanPrices.split(' | ').join('\n')
  await payload.update({ collection: 'projects', id: d.id, data: data as never, overrideAccess: true })
  console.log('set', slug)
}
const l = await payload.find({ collection: 'lands', where: { slug: { equals: 'ridgeview-digana' } }, limit: 1, depth: 0, overrideAccess: true })
if (l.docs[0]) {
  await payload.update({ collection: 'lands', id: l.docs[0].id, data: { coordinates: { lat: 7.2648894, lng: 80.7736818, streetViewAvailable: false } } as never, overrideAccess: true })
  console.log('set ridgeview-digana')
}
process.exit(0)

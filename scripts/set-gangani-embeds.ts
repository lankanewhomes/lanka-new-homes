// Sets each Gangani land's hero embeds from its Gangani page: the Google My Maps
// plot map ("Location" tab -> interactiveMapUrl) and the Street View panorama
// ("360view" tab -> view360Url).
//
//   GANGANI_JSON=<gangani.json> GANGANI_EMBEDS=<gangani_embeds.json> NODE_ENV=production npx tsx scripts/set-gangani-embeds.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const jsonPath = process.env.GANGANI_JSON ?? ''
const embedsPath = process.env.GANGANI_EMBEDS ?? ''
if (!jsonPath || !embedsPath) throw new Error('Set GANGANI_JSON and GANGANI_EMBEDS')

const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

const titleCase = (t: string) => t.split(' ').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ')
const tidy = (t: string) => t.replace(/\s+,/g, ',').replace(/\s+/g, ' ').replace(/[.\s]+$/, '').trim()
const sites = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as { slug: string; name: string }[]
const embeds = JSON.parse(fs.readFileSync(embedsPath, 'utf8')) as Record<string, { map: string | null; sv: string | null }>
const bySite = new Map(sites.map((s) => [titleCase(tidy(s.name)), s.slug]))

const lands = await payload.find({ collection: 'lands', where: { sellerName: { equals: 'Gangani Land Sales' } }, limit: 200, depth: 0, overrideAccess: true })
let n = 0
for (const land of lands.docs as unknown as { id: number; slug: string; title: string }[]) {
  const siteSlug = bySite.get(land.title)
  const e = siteSlug ? embeds[siteSlug] : undefined
  if (!e) { console.log('NO MATCH', land.slug); continue }
  await payload.update({ collection: 'lands', id: land.id, data: { interactiveMapUrl: e.map ?? undefined, view360Url: e.sv ?? undefined } as never, overrideAccess: true })
  n++
}
console.log('DONE', n, 'of', lands.docs.length)
process.exit(0)

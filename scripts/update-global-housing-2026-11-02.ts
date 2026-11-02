/* eslint-disable @typescript-eslint/no-explicit-any -- one-off update script */
// Global Housing & Real Estate (https://www.globalhousing.lk/), owner request 2026-11-02 ("go to this site and look for new info and images, update it").
// The site was rebuilt (sitemap dated 2026-11-02). Changes applied to our 8 listings, all from the developer's own project pages:
//   Edmonton Bliss available 19 -> 18; Park Road available 21 -> 20; Hikkaduwa available 43 -> 41 and starting price 28.0M -> 31.4M; Negombo Phase 2 total units 298 -> 287;
//   new gallery images appended (matched against our existing images by fingerprint, only images we did not have): Edmonton 4, Lakefront 1, Park Road 6, Negombo Phase 2 19, Galle 13.
// The other 13 Global Housing projects on the site are all "Sold Out / Completed" and are not added.
//   GH_DIR=<folder with simg/> NODE_ENV=production npx tsx scripts/update-global-housing-2026-11-02.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.GH_DIR ?? ''
if (!dir) throw new Error('Set GH_DIR')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const MIME: Record<string, string> = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }
const kebab = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// [project slug, id, hash fragment of the site image file, label]
const NEW: [string, string, string][] = [
  ['edmonton-bliss-residencies', '0974a8e226', 'Ground-breaking and launch celebration'], ['edmonton-bliss-residencies', '2070054dc5', 'Pool and lounge'], ['edmonton-bliss-residencies', '6f1d6bcbe9', 'Bedroom with study desk'], ['edmonton-bliss-residencies', 'e551b157ff', 'Living room'],
  ['lakefront-residencies', '982ef820a1', 'Indoor pool'],
  ['park-road-colombo05', '07305190c9', 'Living room, new render'], ['park-road-colombo05', '15b4cc6f0c', 'Dining area'], ['park-road-colombo05', '174ed3e574', 'Bedroom, new render'], ['park-road-colombo05', '6e669df595', 'Living area'], ['park-road-colombo05', 'ddc9c1c1ac', 'Kitchen'], ['park-road-colombo05', 'eab58557c4', 'Building exterior'],
  ['ocean-breeze-galle', '1849e1e936', 'Bedroom with sea view'], ['ocean-breeze-galle', '1bc1a86aeb', 'Gym with sea view'], ['ocean-breeze-galle', '39bfc37192', 'Tower teaser from the coast'], ['ocean-breeze-galle', '3e7e7ab9bc', 'Living room with sea view'], ['ocean-breeze-galle', '6f82e1fceb', 'Tower teaser from the coast road'],
  ['ocean-breeze-galle', '866835262a', 'Games lounge'], ['ocean-breeze-galle', '8a01f1e75c', 'Suite bedroom'], ['ocean-breeze-galle', '922bcc247c', 'Infinity pool at the shoreline'], ['ocean-breeze-galle', 'a6ee9020c1', 'Lobby and reception'],
  ['ocean-breeze-galle', 'b38394cb31', 'Sky lounge'], ['ocean-breeze-galle', 'b46ed02e7c', 'Kitchen and dining'], ['ocean-breeze-galle', 'd055c33195', 'Rooftop garden'], ['ocean-breeze-galle', 'd23c2952bf', 'Gym'],
]
const NEGOMBO = ['1889a59728', '20f1d7a0f4', '254b12c411', '2a35c4c5cc', '2c2dea0a59', '2dc1245bc5', '38f5b0687d', '4c4c94b223', '51b95c6fc1', '62ab96468c', '66f8c84358', '88f2d9e7a3', '8f603f3977', 'a13fc6eddd', 'b689eb7763', 'cf8e815235', 'd7351d2126', 'e20713b81f', 'e99fa3b0bd']
NEGOMBO.forEach((h, i) => NEW.push(['ocean-breeze-negombo-phase-two', h, `Show apartment interior ${i + 1}`]))
const FIELDS: Record<string, Record<string, any>> = {
  'edmonton-bliss-residencies': { availableUnits: 18 },
  'park-road-colombo05': { availableUnits: 20 },
  'ocean-breeze-residencies-hikkaduwa': { availableUnits: 41, startingPriceLkr: 31400000 },
  'ocean-breeze-negombo-phase-two': { units: 287 },
}
const slugs = [...new Set([...NEW.map((n) => n[0]), ...Object.keys(FIELDS)])]
for (const slug of slugs) {
  const doc: any = (await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!doc) { console.log('missing', slug); continue }
  const have = new Set((doc.gallery ?? []).map((g: any) => g.label))
  const added: any[] = []
  for (const [s, hash, label] of NEW.filter((n) => n[0] === slug)) {
    if (have.has(label)) continue
    const file = fs.readdirSync(path.join(dir, 'simg')).find((f) => f.startsWith(`${slug}__${hash}`))
    if (!file) { console.log('  file not found', slug, hash); continue }
    const ext = path.extname(file).toLowerCase()
    const url = await mirrorToR2(`projects/${slug}/gallery/${slug}_${kebab(label)}${ext}`, fs.readFileSync(path.join(dir, 'simg', file)), MIME[ext])
    added.push({ label, image: url })
  }
  const data: Record<string, any> = { ...(FIELDS[slug] ?? {}) }
  if (added.length) data.gallery = [...(doc.gallery ?? []), ...added]
  await payload.update({ collection: 'projects', id: doc.id, data, overrideAccess: true } as never)
  const after: any = await payload.findByID({ collection: 'projects', id: doc.id, depth: 0, overrideAccess: true })
  console.log(slug, '| added images', added.length, '| gallery', (doc.gallery ?? []).length, '->', after.gallery?.length ?? 0, '| units', doc.units, '->', after.units, '| available', doc.availableUnits, '->', after.availableUnits, '| price', doc.startingPriceLkr, '->', after.startingPriceLkr)
}
process.exit(0)

// Writes real, verified per-floor Available/Sold data (extracted from Rush
// Lanka Group's own "View Availability" popups via CDP, 2026-09-30) into
// each project's floorPlans[].floorAvailability field. Only touches plans
// listed below — every other field on every floor plan is preserved as-is
// by re-sending the full (mutated) floorPlans array back.
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })

const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

type FloorRow = { floor: string; available: boolean }
type FloorPlan = { id?: string; planName: string; floorAvailability?: FloorRow[]; [key: string]: unknown }

function rows(spec: string): FloorRow[] {
  // spec like "1A 2A 3S 4S" -> [{floor:'1',available:true}, ...]
  return spec.split(' ').filter(Boolean).map((tok) => {
    const available = tok.endsWith('A')
    const floor = tok.slice(0, -1)
    return { floor, available }
  })
}

const UPDATES: { slug: string; plans: { planName: string; floors: FloorRow[] }[] }[] = [
  {
    slug: 'rush-court-6-mount-lavinia',
    plans: [
      { planName: 'Unit A', floors: rows('1A 2A 3S 4S 5S 6S 7S 8A 9A') },
      { planName: 'Unit B', floors: rows('1A 2A 3S 4A 5S 6S 7S 8S 9S') },
      { planName: 'Unit C', floors: rows('1S 2A 3A 4A 5S 6A 7S 8S 9S') },
      { planName: 'Unit D', floors: rows('1S 2A 3S 4A 5S 6S 7S 8S 9A') },
      { planName: 'Unit E', floors: rows('1S 2A 3S 4S 5S 6S 7S 8S 9S') },
      { planName: 'Unit F', floors: rows('1A 2A 3S 4S 5A 6S 7S 8S 9A') },
    ],
  },
  {
    slug: 'rush-city-dematagoda',
    plans: [
      { planName: 'Aqua Crest (South City Tower)', floors: rows('1A') },
      { planName: 'South Crest (South City Tower)', floors: rows('1A') },
      { planName: 'Urban Crest (South City Tower)', floors: rows('1A') },
    ],
  },
  {
    slug: 'rush-residencies-allen-dehiwala',
    plans: [
      { planName: 'Unit A', floors: rows('1S 2S 3S 4S 5S 6S 7S 8S 9S 10S 11S 12S 13S 14A') },
      { planName: 'Unit B', floors: rows('1S 2S 3S 4S 5S 6S 7S 8S 9S 10S 11S 12S 13S 14S') },
      { planName: 'Unit C', floors: rows('1S 2S 3S 4S 5S 6S 7S 8S 9S 10S 11S 12S 13S 14S') },
      { planName: 'Unit D', floors: rows('1S 2S 3S 4S 5S 6S 7S 8S 9S 10S 11S 12S 13S 14S') },
    ],
  },
  {
    slug: 'imaarat-bambalapitiya',
    plans: [
      { planName: 'Unit A', floors: rows('1S 2S 3S 4S 5S 6S 7S 8S 9S 10S 11S 12S 13S 14S 15S') },
      { planName: 'Unit B', floors: rows('1A 2A 3A 4A 5A 6S 7S 8S 9S 10S 11S 12S 13S 14S 15S') },
      { planName: 'Unit C', floors: rows('1S 2S 3S 4S 5S 6S 7A 8S 9S 10S 11S 12S 13S 14S 15S') },
    ],
  },
  {
    slug: 'street-rush-residencies-mount-lavinia',
    plans: [
      { planName: 'Unit A', floors: rows('1S 2S 3S 4S 5S 6S 7S 8S 9S') },
      { planName: 'Unit B', floors: rows('1S 2S 3S 4S 5S 6S 7S 8A 9S 10A') },
      { planName: 'Unit C', floors: rows('1A 2A 3A 4S 5S 6S 7S 8A 9S 10A') },
      { planName: 'Unit D', floors: rows('2S 3S 4S 5A 6S 7S 8S 9S') },
      { planName: 'Unit E', floors: rows('10A') },
    ],
  },
  {
    slug: 'rush-metropolis-dehiwala',
    plans: [
      { planName: 'Unit A', floors: rows('1S 2S 3S 4S 5S 6S 7S 8S 9S 10S 11S 12S 13S 14S 15S 16S 17S 18S') },
      { planName: 'Unit B', floors: rows('1S 2S 3S 4S 5S 6S 7S 8S 9S 11S 12S 13S 14S 15S 16S 17S 18S') },
      { planName: 'Unit C', floors: rows('1S 2S 3S 4S 5S 6S 7S 8S 9S 10S 11S 12S 13S 14S 15S 16S 17S 18S') },
      { planName: 'Unit D', floors: rows('1S 2S 3S 4S 5S 6S 7S 8S 9S 10S 11S 12S 13S 14S 15S 16S 17S 18S') },
      { planName: 'Unit E', floors: rows('1S 2S 3S 4S 5S 6S 7S 8S 9S 10S 11S 12S 13S 14S 15S 16S 17S 18S') },
      { planName: 'Unit F', floors: rows('1S 2S 3S 4S 5S 6S 7S 8S 9S 10S 11S 12S 13S 14S 15S 16S 17S 18S') },
      { planName: 'Unit G', floors: rows('1S 2S 3S 4S 5S 6S 7S 8S 9S 10S 11S 12S 13S 14S 15S 16S 17S 18S') },
    ],
  },
  {
    slug: 'maimoona-residencies-dehiwala',
    plans: [
      { planName: 'Unit A', floors: rows('1S 2S 3S 4S 5S 6S 7S 8S') },
      { planName: 'Unit B', floors: rows('1S 2S 3S 4S 5S 6S 7S 8S') },
      { planName: 'Unit C', floors: rows('5S 6S 7S 8S') },
    ],
  },
  {
    slug: 'rush-court-5-colombo-14',
    plans: [
      { planName: 'Unit A', floors: rows('1S 2S 3S 4S 5S 6S 7S') },
      { planName: 'Unit B', floors: rows('1A 2A 3S 4S 5S 6S 7S') },
      { planName: 'Unit C', floors: rows('1A 2A 3S 4S 5S 6S 7S') },
    ],
  },
]

for (const { slug, plans } of UPDATES) {
  const { docs } = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })
  const project = docs[0]
  if (!project) {
    console.log(`SKIP ${slug}: not found`)
    continue
  }
  const floorPlans = ((project as unknown as { floorPlans?: FloorPlan[] }).floorPlans ?? []).slice()
  let changed = 0
  for (const update of plans) {
    const idx = floorPlans.findIndex((p) => p.planName === update.planName)
    if (idx === -1) {
      console.log(`  ${slug}: planName "${update.planName}" NOT FOUND — skipped`)
      continue
    }
    floorPlans[idx] = { ...floorPlans[idx], floorAvailability: update.floors }
    changed++
  }
  if (changed === 0) {
    console.log(`SKIP ${slug}: no matching plans`)
    continue
  }
  await payload.update({
    collection: 'projects',
    id: project.id,
    data: { floorPlans } as never,
    overrideAccess: true,
  })
  console.log(`OK ${slug}: wrote floorAvailability for ${changed} plan(s)`)
}

console.log('\nDone.')
process.exit(0)

/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Colombo 15 (Mutwal) neighbourhood page, created as a DRAFT (isPublished false) 2026-11-08 at the owner's request.
// Facts are only what Wikipedia (Modara, Mattakkuliya, Kelani River) and the Marina Square site state; no population, history,
// hospitals or transport stations were found in those sources, so none are entered. Hero is a Marina Square render as a placeholder.
//   NODE_ENV=production npx tsx scripts/create-colombo-15-neighborhood.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })

const SLUG = 'colombo-15'
const existing = (await payload.find({ collection: 'neighborhoods' as never, where: { slug: { equals: SLUG } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any
if (existing) { console.log('exists', existing.id, 'published:', existing.isPublished); process.exit(0) }

const rad = (d: number) => (d * Math.PI) / 180
const km = (a: [number, number], b: [number, number]) => {
  const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(h)) * 10) / 10
}
const centre: [number, number] = [6.95944, 79.87528] // Modara, per Wikipedia
const mouth: [number, number] = [6.97889, 79.87] // Kelani River mouth, per Wikipedia

const created = (await payload.create({
  collection: 'neighborhoods' as never,
  overrideAccess: true,
  data: {
    slug: SLUG, name: 'Colombo 15 (Mutwal)', isPublished: false,
    city: 'Colombo', province: 'Western', district: 'Colombo District',
    approxLocation: 'Colombo North, north of the Fort, where the Kelani River meets the sea',
    nearbyAreas: ['Colombo 14', 'Kotahena', 'Peliyagoda', 'Wattala', 'Madampitiya', 'Bloemendhal'],
    latitude: centre[0], longitude: centre[1], mapRadiusKm: 2,
    description:
      'Colombo 15 is the postal area in Colombo North that takes in Mutwal (Modara) and Mattakkuliya, in the Colombo District of the Western Province, beside the mouth of the Kelani River. Modara, also called Mutwal, is a municipal ward of Colombo, and both suburbs share the postal code 01500. Bloemendhal, Madampitiya, Grandpass, Peliyagoda, Wattala and Crow Island are listed as neighbouring places.\n\nThe Kelani River reaches the Indian Ocean here and supplies about 80% of the water used in Colombo. Part of the city and its suburbs lie on the lower flood plain of the river, so it is worth asking about drainage and flood history for any specific building or plot. Bridges on the lower river include the Mattakkuliya Bridge on the Mattakkuliya-Hekitta Road and the New Kelani Bridge on the Colombo-Kandy Road, a 275 m crossing completed in 1959.\n\nMattakkuliya has schools including Razik Fareed Muslim Vidyalaya and Northshore College of Business and Technology, and its places of worship include St. Mary\'s Church, St. John\'s Church, Sri Kalyani Ganagarama Temple and several mosques and churches.\n\nColombo North is being repositioned as "Uptown Colombo". Marina Square, a five-tower condominium on Srimath Ramanathan Mawatha, says Port City is about 2 km away and that an entry and exit point of the Port Access Elevated Highway, which it describes as already under way, will be 400 m from the project. These are the developer\'s own statements and have not been checked independently.',
    sources: [
      { label: 'Wikipedia: Modara (Mutwal)', url: 'https://en.wikipedia.org/wiki/Modara' },
      { label: 'Wikipedia: Mattakkuliya', url: 'https://en.wikipedia.org/wiki/Mattakkuliya' },
      { label: 'Wikipedia: Kelani River', url: 'https://en.wikipedia.org/wiki/Kelani_River' },
      { label: 'Marina Square - Uptown Colombo (developer site)', url: 'https://marinasquare.lk/en/faq' },
    ],
    faqs: [
      { question: 'What is Colombo 15?', answer: 'Colombo 15 is the postal area (code 01500) in Colombo North covering Mutwal (Modara) and Mattakkuliya, in the Colombo District of the Western Province. It sits beside the mouth of the Kelani River.' },
      { question: 'Is Colombo 15 at risk of flooding?', answer: 'Part of Colombo and its suburbs lie on the lower flood plain of the Kelani River, which meets the sea in this area. Ask the seller about drainage and flood history for the specific building or plot, and check the floor level and the site\'s drainage before you buy.' },
    ],
    heroImage: 'https://media.lankanewhomes.com/projects/marina-square-colombo-15/gallery/marina-square-colombo-15_five-towers-aerial.jpg',
    heroImageCredit: 'Render: Marina Square - Uptown Colombo (placeholder until an area photo is added)',
    heroImageSourceUrl: 'https://marinasquare.lk/en',
    highlights: [
      'Colombo 15 (Mutwal and Mattakkuliya), Colombo North',
      'Beside the mouth of the Kelani River',
      'Developer says Port City is about 2 km from Marina Square',
      'Check flood history: part of the area is on the Kelani flood plain',
    ],
    nearby: [
      { category: 'Landmark', name: 'Kelani River mouth', distanceKm: km(centre, mouth), lat: mouth[0], lng: mouth[1] },
      { category: 'Road', name: 'New Kelani Bridge (Colombo-Kandy Road)' },
      { category: 'Road', name: 'Mattakkuliya Bridge (Mattakkuliya-Hekitta Road)' },
      { category: 'School', name: 'Razik Fareed Muslim Vidyalaya' },
      { category: 'School', name: 'Northshore College of Business and Technology' },
    ],
  } as never,
})) as any
console.log('neighbourhood created', created.id, created.slug, 'published:', created.isPublished)

// Link the Marina Square listing to the new page (the page stays hidden, so the listing shows no link to it until you publish).
const proj = (await payload.find({ collection: 'projects' as never, where: { slug: { equals: 'marina-square-colombo-15' } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any
if (proj) {
  await payload.update({ collection: 'projects' as never, id: proj.id, overrideAccess: true, data: { neighborhood: created.id, neighborhood_other: '' } as never })
  console.log('project linked', proj.id)
}
process.exit(0)

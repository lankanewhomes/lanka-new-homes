/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Neighbourhood pages: Kadirana (Negombo), Kesbewa / Kindelpitiya, Balummahara (Gampaha) + marks to-dos 109/110/111 done.
//   KB_DIR=<folder with out/*.jpg> NODE_ENV=production npx tsx scripts/nb-kadirana-kesbewa-balummahara.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const base = process.env.KB_DIR ?? ''
if (!base) throw new Error('Set KB_DIR')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const W = 'via Wikimedia Commons'
const wc = (f: string) => 'https://commons.wikimedia.org/wiki/File:' + f

type Ph = [string, string, string, string, string, string] // file prefix+idx, key, caption, landmark, credit, sourceUrl
const pages: any[] = [
  {
    slug: 'kadirana', todo: 109, prefix: 'kad', name: 'Kadirana', city: 'Negombo', district: 'Gampaha District', province: 'Western',
    approxLocation: 'Inland from Negombo town, a few kilometres north of Bandaranaike International Airport',
    nearbyAreas: ['Negombo', 'Katunayake', 'Seeduwa', 'Ja-Ela'], latitude: 7.2199, longitude: 79.886, mapRadiusKm: 2, hero: 1,
    description:
      'Kadirana is a residential area inland from Negombo, in Gampaha District on the Western Province coast. It sits a few kilometres north of Bandaranaike International Airport, with the Negombo Lagoon and the town centre to the west. Negombo is known for its Catholic churches, its fishing harbour and its long beach, while Katunayake, close by, is the home of the country\'s main international airport and an export processing zone.',
    highlights: ['Inland residential area close to Negombo town', 'Negombo Lagoon and the town\'s fishing harbour nearby', 'Bandaranaike International Airport a short drive south', 'St. Mary\'s Church and Angurukaramulla Temple in Negombo', 'Negombo beach on the western side of town'],
    faqs: [
      { question: 'Where is Kadirana?', answer: 'Kadirana is a residential area in the Negombo part of Gampaha District, Western Province, a few kilometres north of Bandaranaike International Airport and inland from Negombo town.' },
      { question: 'What is close to Kadirana?', answer: 'Negombo town with its lagoon, beach and churches, the Angurukaramulla Temple, and Katunayake with Bandaranaike International Airport are all nearby.' },
    ],
    photos: [
      ['0', 'angurukaramulla-temple', 'Angurukaramulla Temple in Negombo', 'Angurukaramulla Temple', `Photo: Steffen Schmitz, CC BY-SA 4.0 ${W}`, wc('Negombo,_Angurukaramulla_Temple,_2025-07_CN-01.jpg')],
      ['1', 'negombo-lagoon', 'The Negombo Lagoon', 'Negombo Lagoon', `Photo: Steffen Schmitz, CC BY-SA 4.0 ${W}`, wc('Negombo,_Lagoon,_2025-08_CN-01.jpg')],
      ['2', 'bandaranaike-international-airport', 'Bandaranaike International Airport at Katunayake', 'Bandaranaike International Airport', `Photo: ANKAN, CC BY-SA 4.0 ${W}`, wc('Bandaranaike_International_Airport_(2).jpg')],
      ['3', 'st-marys-church', "St. Mary's Church, Negombo", "St. Mary's Church, Negombo", `Photo: Steffen Schmitz, CC BY-SA 4.0 ${W}`, wc("Negombo,_St._Mary%27s_Church,_2025-07_CN-02.jpg")],
      ['4', 'negombo-beach', 'Sunset over Negombo beach', 'Negombo Beach', `Photo: Dhananjaya Bulathwatte, CC BY-SA 4.0 ${W}`, wc('Negombo_beach_3.jpg')],
      ['5', 'katunayake-railway-station', 'Katunayake railway station', 'Katunayake Railway Station', `Photo: Steffen Schmitz, CC BY-SA 4.0 ${W}`, wc('Katunayake,_Railway_Station,_2025-08_CN-01.jpg')],
    ],
    nearby: [['Landmark', 'Angurukaramulla Temple'], ['Landmark', 'Negombo Lagoon'], ['Landmark', 'Bandaranaike International Airport'], ['Landmark', "St. Mary's Church, Negombo"], ['Landmark', 'Negombo Beach'], ['Landmark', 'Katunayake Railway Station'], ['Transport', 'Katunayake Railway Station'], ['Road', 'Colombo-Negombo Road (A3)']],
    action: 'Created the Kadirana neighbourhood page (new page; the Negombo page already existed): 6 area photos from Wikimedia Commons with credits (CC BY-SA), short description, highlights, FAQs, map centre and nearby landmarks.',
  },
  {
    slug: 'kesbewa', todo: 111, prefix: 'kes', name: 'Kesbewa', city: 'Kesbewa', district: 'Colombo District', province: 'Western',
    approxLocation: 'About 20 km south-east of Colombo, beside Piliyandala and close to Bolgoda Lake',
    nearbyAreas: ['Piliyandala', 'Kahathuduwa', 'Boralesgamuwa', 'Moratuwa', 'Bandaragama'], latitude: 6.7471, longitude: 79.9626, mapRadiusKm: 2, hero: 2,
    description:
      'Kesbewa is a town in Colombo District, on the southern side of the Greater Colombo area. It is home to the Kindelpitiya locality and sits right beside Piliyandala, whose clock tower and busy market form the nearest town centre. The Bolgoda lakes lie to the west, and the surrounding area mixes established residential streets with temples, schools and small businesses.',
    highlights: ['Kindelpitiya locality within the Kesbewa area', 'Piliyandala town centre, clock tower and market next door', 'Bolgoda Lake a short distance to the west', 'Temples and schools throughout the area', 'Greater Colombo suburb in Colombo District'],
    faqs: [
      { question: 'Where is Kesbewa?', answer: 'Kesbewa is a town in Colombo District, Western Province, on the southern edge of Greater Colombo. It adjoins Piliyandala and includes the Kindelpitiya area.' },
      { question: 'What is near Kesbewa?', answer: 'Piliyandala town with its clock tower and market, the Bolgoda lakes, and the Vidhyashanthi Buddhist temple are all close by.' },
    ],
    photos: [
      ['0', 'piliyandala-clock-tower', 'The clock tower in Piliyandala town', 'Piliyandala Clock Tower', `Photo: Varuna Harshana, CC BY-SA 3.0 ${W}`, wc('Piliyandala_Clock_Tower.jpg')],
      ['1', 'piliyandala-market', 'Piliyandala main market', 'Piliyandala Market', `Photo: Gobbler, CC BY-SA 3.0 ${W}`, wc('Piliyandala_Main_Market.JPG')],
      ['2', 'bolgoda-lake', 'Bolgoda Lake', 'Bolgoda Lake', `Photo: Kaveen Weerarathna, CC BY-SA 4.0 ${W}`, wc('Bolgoda_Lake,_Sri_Lanka.jpg')],
      ['3', 'vidhyashanthi-temple', 'Vidhyashanthi Buddhist temple, Piliyandala', 'Vidhyashanthi Buddhist Temple', `Photo: Skf, CC BY-SA 4.0 ${W}`, wc('Piliyandala_Vidhyashanthi_Buddhist_temple.jpg')],
      ['4', 'bolgoda-lake-dusk', 'Dusk on the Bolgoda lakes', 'Bolgoda Lake', `Photo: Sahan.kulathunge, CC BY-SA 4.0 ${W}`, wc('BOLGODA.jpg')],
    ],
    nearby: [['Landmark', 'Piliyandala Clock Tower'], ['Landmark', 'Piliyandala Market'], ['Landmark', 'Bolgoda Lake'], ['Landmark', 'Vidhyashanthi Buddhist Temple'], ['Road', 'Kesbewa Road'], ['Road', 'Colombo-Horana Road (B84)']],
    action: 'Created the Kesbewa / Kindelpitiya neighbourhood page (no Kesbewa page existed): 5 area photos from Wikimedia Commons with credits (CC BY-SA), short description, highlights, FAQs, map centre and nearby landmarks.',
  },
  {
    slug: 'balummahara', todo: 110, prefix: 'bal', name: 'Balummahara', city: 'Gampaha', district: 'Gampaha District', province: 'Western',
    approxLocation: 'Close to Gampaha town, in Gampaha District',
    nearbyAreas: ['Gampaha', 'Yakkala', 'Veyangoda', 'Nittambuwa'], latitude: 7.0643, longitude: 80.0023, mapRadiusKm: 2, hero: 0,
    description:
      'Balummahara is a residential area close to Gampaha town in Gampaha District, Western Province. Gampaha is the district capital and is known for the Henarathgoda Botanical Garden, where Sri Lanka\'s first rubber tree was planted in 1876, and for the historic Asgiriya Raja Maha Vihara. Bandaranayake College and the old Henarathgoda railway station are also in Gampaha, which sits on the Colombo to Kandy railway line.',
    highlights: ['Close to Gampaha, the district capital', 'Henarathgoda Botanical Garden, home of the first rubber tree in Sri Lanka', 'Asgiriya Raja Maha Vihara temple nearby', 'Bandaranayake College in Gampaha', 'Gampaha lies on the Colombo to Kandy railway line'],
    faqs: [
      { question: 'Where is Balummahara?', answer: 'Balummahara is a residential area close to Gampaha town in Gampaha District, Western Province.' },
      { question: 'What is Gampaha known for?', answer: 'Gampaha is the district capital and is known for the Henarathgoda Botanical Garden, where the first rubber tree in Sri Lanka was planted, and for the Asgiriya Raja Maha Vihara.' },
    ],
    photos: [
      ['0', 'henarathgoda-botanical-garden', 'Flower beds at Henarathgoda Botanical Garden', 'Henarathgoda Botanical Garden', `Photo: L Manju, CC BY-SA 4.0 ${W}`, wc('Henarathgoda_Botanical_Garden.jpg')],
      ['1', 'bandaranayake-college', 'Bandaranayake College, Gampaha', 'Bandaranayake College', `Photo: anjana.sudam, CC BY-SA 3.0 ${W}`, wc('Bandaranayake_college_-_panoramio.jpg')],
      ['2', 'henarathgoda-railway-station', 'The old Henarathgoda railway station', 'Henarathgoda Old Railway Station', `Photo: L Manju, CC BY-SA 4.0 ${W}`, wc('Henarathgoda_old_railway_station.jpg')],
      ['3', 'first-rubber-tree', 'The site of the first rubber tree in Sri Lanka, Henarathgoda', 'First Rubber Tree Site', `Photo: Sadunik sewwandi, CC BY-SA 4.0 ${W}`, wc('First_Rubber_Plant_in_Sri_Lanka_at_Henarathgoda_Botanical_Garden.jpg')],
      ['4', 'asgiriya-raja-maha-vihara', 'The stupa at Asgiriya Raja Maha Vihara', 'Asgiriya Raja Maha Vihara', `Photo: L Manju, CC BY-SA 4.0 ${W}`, wc('Asgiriya_Raja_Maha_Vihara,_Gampaha_2.jpg')],
    ],
    nearby: [['Landmark', 'Henarathgoda Botanical Garden'], ['Landmark', 'Bandaranayake College'], ['Landmark', 'Henarathgoda Old Railway Station'], ['Landmark', 'First Rubber Tree Site'], ['Landmark', 'Asgiriya Raja Maha Vihara'], ['Transport', 'Gampaha Railway Station'], ['Road', 'Colombo-Kandy Road (A1)']],
    action: 'Created the Balummahara neighbourhood page (new page; the Gampaha page already existed): 5 area photos from Wikimedia Commons with credits (CC BY-SA), short description, highlights, FAQs, map centre and nearby landmarks.',
  },
]

for (const pg of pages) {
  const words = pg.description.trim().split(/\s+/).length
  if (words < 50 || words > 100) throw new Error(`${pg.slug} description ${words} words`)
  for (const [, name] of pg.nearby.filter((n: any) => n[0] === 'Landmark').map((n: any) => n)) void name
  const existing = ((await payload.find({ collection: 'neighborhoods', where: { slug: { equals: pg.slug } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0]) as any
  if (existing) { console.log('exists, skipping', pg.slug); continue }
  const gallery: any[] = []
  const urls: string[] = []
  for (const [idx, k, caption, landmark, credit, sourceUrl] of pg.photos as Ph[]) {
    if (!pg.nearby.some((n: any) => n[0] === 'Landmark' && n[1] === landmark)) throw new Error('landmark missing ' + landmark)
    const buf = fs.readFileSync(path.join(base, `${pg.prefix}${idx}.jpg`))
    const url = await mirrorToR2(`neighborhoods/${pg.slug}/${pg.slug}_${Number(idx) + 1}_${k}.jpg`, buf, 'image/jpeg')
    urls.push(url)
    gallery.push({ url, caption, credit, sourceUrl, landmark })
  }
  const h = pg.photos[pg.hero] as Ph
  const doc = await payload.create({
    collection: 'neighborhoods',
    data: {
      slug: pg.slug, name: pg.name, city: pg.city, province: pg.province, district: pg.district, approxLocation: pg.approxLocation,
      nearbyAreas: pg.nearbyAreas, latitude: pg.latitude, longitude: pg.longitude, mapRadiusKm: pg.mapRadiusKm,
      description: pg.description, highlights: pg.highlights, faqs: pg.faqs,
      heroImage: urls[pg.hero], heroImageCredit: h[4], heroImageSourceUrl: h[5], gallery,
      nearby: pg.nearby.map(([category, name]: string[]) => ({ category, name })),
    } as never,
    overrideAccess: true,
  })
  console.log('created', pg.slug, doc.id, words, 'words')
  await payload.update({ collection: 'listing-todos', id: pg.todo, data: { done: true, actionTaken: pg.action + ' (16 Oct 2026)', actionAt: new Date().toISOString() } as never, overrideAccess: true, depth: 0 })
  console.log('todo done', pg.todo)
}
process.exit(0)

/* eslint-disable @typescript-eslint/no-explicit-any */
// Neighbourhood pages: Meegoda, Hadeniya, Gattuwana, Kiriwaththuduwa, Halthota (+ nearby fixes for Meepe, Bandaragama). 16 Oct 2026.
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const S = '/private/tmp/claude-501/-Users-rupansinnarajah-Desktop-lankanewhomes/e4990c10-5391-4fb0-8f5a-3a7fe8004abd/scratchpad'
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const sharp = (await import('sharp')).default
const payload = await getPayload({ config: cfg })
const find = async (slug: string) => ((await payload.find({ collection: 'neighborhoods', where: { slug: { equals: slug } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any)
const W = 'via Wikimedia Commons'
const wc = (f: string) => 'https://commons.wikimedia.org/wiki/File:' + f.replace(/ /g, '_')
type P = { src: string; file: string; key: string; caption: string; landmark: string; artist: string; lic: string }
const photo = (src: string, file: string, key: string, caption: string, landmark: string, artist: string, lic: string): P => ({ src, file, key, caption, landmark, artist, lic })
const credit = (p: { artist: string; lic: string }) => `Photo: ${p.artist}, ${p.lic === 'Public domain' ? 'public domain' : p.lic} ${W}`

async function addPhotos(slug: string, photos: P[], nearbyExtra: any[], extra: Record<string, any> = {}, heroIdx = 0) {
  const doc = await find(slug)
  const gallery: any[] = [...(doc.gallery ?? [])]
  const have = new Set(gallery.map((g) => g.sourceUrl))
  let heroSet = !!doc.heroImage
  const data: any = { ...extra }
  let k = gallery.length
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i]
    if (have.has(wc(p.file))) continue
    const buf = await sharp(fs.readFileSync(path.join(S, p.src))).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 84 }).toBuffer()
    const url = await mirrorToR2(`neighborhoods/${slug}/${slug}_${p.key}.jpg`, buf, 'image/jpeg')
    gallery.push({ url, caption: p.caption, credit: credit(p), sourceUrl: wc(p.file), landmark: p.landmark })
    if (!heroSet && i === heroIdx) { data.heroImage = url; data.heroImageCredit = credit(p); data.heroImageSourceUrl = wc(p.file); heroSet = true }
    k++
  }
  const nearby: any[] = [...(doc.nearby ?? [])]
  for (const n of nearbyExtra) if (!nearby.some((x) => x.name === n.name)) nearby.push(n)
  for (const g of gallery) if (g.landmark && !nearby.some((x) => x.name === g.landmark)) throw new Error(slug + ' missing nearby ' + g.landmark)
  data.gallery = gallery
  data.nearby = nearby
  await payload.update({ collection: 'neighborhoods', id: doc.id, data, overrideAccess: true, depth: 0 })
  console.log(slug, 'gallery', gallery.length, 'nearby', nearby.length)
}
const L = (name: string, lat?: number, lng?: number) => ({ category: 'Landmark', name, lat, lng })

// ---- Meegoda (area photos: Homagama division and neighbouring Pannipitiya, honestly captioned)
await addPhotos('meegoda', [
  photo('m2/1.jpg', 'Ananda Bodhi Viharaya - panoramio (4).jpg', 'ananda-bodhi-viharaya', 'Ananda Bodhi Viharaya, a Bodhi tree shrine in Pannipitiya, the next area west of Homagama', 'Ananda Bodhi Viharaya', 'tera-tera', 'CC BY 3.0'),
  photo('m/0.jpg', 'Convo 06.jpg', 'buddhist-pali-university', 'The Buddhist and Pali University of Sri Lanka at Pitipana, Homagama, a few kilometres from Meegoda', 'Buddhist and Pali University, Homagama', 'Bpudinesh', 'CC BY-SA 4.0'),
  photo('m/5.jpg', 'Thaldiyawala, Sri Lanka - panoramio.jpg', 'thaldiyawala-road', 'A road and bus halt at Thaldiyawala in the Pannipitiya area, west of Homagama', 'Thaldiyawala', 'tera-tera', 'CC BY 3.0'),
  photo('m/6.jpg', 'Boralugoda, Sri Lanka - panoramio.jpg', 'boralugoda', 'Coconut palms and a village rest hut at Boralugoda in the Pannipitiya area', 'Boralugoda', 'tera-tera', 'CC BY 3.0'),
  photo('m/4.jpg', 'Pore Temple - panoramio.jpg', 'pore-temple', 'Steps up to Pore Temple in the Pannipitiya area', 'Pore Temple', 'tera-tera', 'CC BY 3.0'),
], [L('Ananda Bodhi Viharaya', 6.8885, 79.9818), L('Buddhist and Pali University, Homagama', 6.8424, 80.0251), L('Thaldiyawala', 6.8813, 79.9833), L('Boralugoda', 6.8817, 79.9828), L('Pore Temple', 6.8819, 79.9819),
  { category: 'Transport', name: 'Meegoda railway station' }], { mapRadiusKm: 3 })

// ---- Kiriwaththuduwa (Kottawa town = nearest main hub)
await addPhotos('kiriwaththuduwa', [
  photo('m/12.jpg', 'Kottawa Town, Pannipitiya, Sri Lanka - panoramio.jpg', 'kottawa-main-road', 'The main road through Kottawa town, the nearest hub to Kiriwaththuduwa', 'Kottawa', 'Daibo Taku', 'CC BY 3.0'),
  photo('m/15.jpg', 'Kottawa Town, Pannipitiya, Sri Lanka - panoramio (6).jpg', 'kottawa-traffic', 'Buses and three-wheelers on the A4 road at Kottawa', 'Kottawa', 'Daibo Taku', 'CC BY 3.0'),
  photo('m2/3.jpg', 'Kottawa, Pannipitiya, Sri Lanka - panoramio (1).jpg', 'kottawa-shops', 'Shops and a supermarket in Kottawa town', 'Kottawa', 'Daibo Taku', 'CC BY 3.0'),
], [])

// ---- Halthota (neighbouring Bandaragama photos reused from R2, plus Bellapitiya)
{
  const b = await find('bandaragama')
  const pick = (name: string) => b.gallery.find((g: any) => g.url.includes(name))
  const reuse = [
    ['wawita-lake', 'Wawita lake in neighbouring Bandaragama, where elephants are bathed', 'Wawita lake'],
    ['sunset-over-a-small', 'Sunset over a small lake in neighbouring Bandaragama', 'Bandaragama lake at sunset'],
    ['veedagama-temple', 'Buddhist temple buildings at Veedagama West in neighbouring Bandaragama', 'Veedagama temple'],
  ] as const
  const h = await find('halthota')
  const gallery: any[] = [...h.gallery]
  for (const [n, cap, lm] of reuse) { const g = pick(n); if (g && !gallery.some((x) => x.sourceUrl === g.sourceUrl)) gallery.push({ ...g, id: undefined, caption: cap, landmark: lm }) }
  await payload.update({ collection: 'neighborhoods', id: h.id, data: { gallery }, overrideAccess: true, depth: 0 })
  await addPhotos('halthota', [
    photo('m/21.jpg', 'Bellapitiya.jpg', 'bellapitiya-junction', 'A shop and road junction at Bellapitiya, a village near Halthota', 'Bellapitiya', 'Superatp', 'CC BY-SA 4.0'),
  ], [L('Wawita lake'), L('Bandaragama lake at sunset'), L('Veedagama temple'), L('Bellapitiya')])
}

// ---- Gattuwana (Kurunegala town and Ethagala, captions say so)
await addPhotos('gattuwana', [
  photo('g/2.jpg', 'View from Athagala Kurunegala1.jpg', 'view-from-athugala', 'View over Kurunegala Lake and the hills from Athugala (Elephant Rock), Kurunegala', 'Athugala (Elephant Rock), Kurunegala', 'Kurun', 'Public domain'),
  photo('g/1.jpg', 'Kurunegala elephantrock Buddha statue1.jpg', 'buddha-statue-athugala', 'The giant Buddha statue on Athugala (Elephant Rock), Kurunegala', 'Athugala (Elephant Rock), Kurunegala', 'Kurun', 'Public domain'),
  photo('g/3.jpg', 'View2 from Athagala Kurunegala.jpg', 'kurunegala-town-view', 'Kurunegala town centre seen from Athugala', 'Kurunegala town', 'Kurun', 'Public domain'),
  photo('g/5.jpg', 'Kurunegala Lake.jpg', 'kurunegala-lake', 'Kurunegala Lake in the centre of Kurunegala town', 'Kurunegala Lake', 'Vakeezan', 'CC BY-SA 4.0'),
  photo('g/9.jpg', 'Ethagala 02.JPG', 'ethagala-from-lake', 'Ethagala (Elephant Rock) rising above Kurunegala Lake', 'Kurunegala Lake', 'Cherubino', 'CC BY-SA 3.0'),
  photo('g/4.jpg', 'Clock Tower (Kurunegala).JPG', 'kurunegala-clock-tower', 'The Clock Tower in Kurunegala town', 'Kurunegala Clock Tower', 'AntanO', 'CC BY-SA 4.0'),
], [L('Athugala (Elephant Rock), Kurunegala', 7.4806, 80.3569), L('Kurunegala town', 7.4863, 80.3623), L('Kurunegala Lake', 7.4818, 80.3637), L('Kurunegala Clock Tower', 7.4863, 80.3623)],
  { latitude: 7.4737, longitude: 80.3712, mapRadiusKm: 2, approxLocation: 'East of Kurunegala town in the Mallawapitiya area, Kurunegala District' })

// ---- Hadeniya (Kandy district; Kandy and Peradeniya landmarks, captions say so)
const hDesc = 'Hadeniya is a hill-country locality in Kandy District, Central Province, roughly 10 km west-north-west of Kandy city centre. It lies near Nugawela and Ambatenna, with the Mahaweli River, the Royal Botanic Gardens at Peradeniya and Kandy Lake all within a short drive. Kandy, the hill capital, is the nearest city, and local shops and a hospital serve everyday needs nearby.'
await addPhotos('hadeniya', [
  photo('h/5.jpg', 'Kandy Lake View from Kandy View Point.jpg', 'kandy-lake-view', 'Kandy city and Kandy Lake seen from a viewpoint, about 10 km from Hadeniya', 'Kandy Lake', 'Rilwan19760430', 'CC BY-SA 4.0'),
  photo('h/1.jpg', 'Botanical Garden of Peradeniya 03.jpg', 'peradeniya-gardens-flower-beds', 'Flower beds in the Royal Botanic Gardens, Peradeniya', 'Royal Botanic Gardens, Peradeniya', 'Bernard Gagnon', 'CC BY-SA 3.0'),
  photo('h/0.jpg', 'Royal Botanical Garden, Peradeniya 02 (js).jpg', 'peradeniya-gardens-lawn', 'Great trees on the lawns of the Royal Botanic Gardens, Peradeniya', 'Royal Botanic Gardens, Peradeniya', 'Jerzy Strzelecki', 'CC BY-SA 3.0'),
  photo('h/3.jpg', 'Mahaweli River at Gannoruwa Sri Lanka.JPG', 'mahaweli-gannoruwa', 'The Mahaweli River at Gannoruwa, near Peradeniya', 'Mahaweli River at Gannoruwa', 'Hasindu2008', 'CC BY-SA 3.0'),
  photo('h/9.jpg', 'Island of Kandy lake.JPG', 'kandy-lake-island', 'The island fountain in Kandy Lake', 'Kandy Lake', 'AntanO', 'CC BY-SA 4.0'),
  photo('h/4.jpg', 'Kandy Lake - Central Province.jpg', 'kandy-lake-shore', 'The shore of Kandy Lake', 'Kandy Lake', 'Amal Balasooriya', 'CC BY-SA 4.0'),
], [L('Kandy Lake', 7.2937, 80.6389), L('Royal Botanic Gardens, Peradeniya', 7.2692, 80.5959), L('Mahaweli River at Gannoruwa', 7.2640, 80.6000),
  { category: 'Hospital', name: 'Thiththapajjala Hospital' }, { category: 'Shopping', name: "Cargill's Supermarket" }, { category: 'Landmark', name: 'Kandy' }],
  { description: hDesc, district: 'Kandy District', province: 'Central', city: 'Hadeniya', latitude: 7.3295, longitude: 80.5491, mapRadiusKm: 3,
    approxLocation: 'About 10 km west-north-west of Kandy city centre, near Nugawela and Ambatenna', nearbyAreas: ['Kandy', 'Peradeniya', 'Nugawela', 'Ambatenna', 'Gampola'],
    highlights: ['In Kandy District, about 10 km from Kandy city centre', 'Near Nugawela and Ambatenna', 'Royal Botanic Gardens, Peradeniya within a short drive', 'Mahaweli River and Kandy Lake nearby', 'Hill-country setting'],
    faqs: [{ question: 'Where is Hadeniya?', answer: 'Hadeniya is a locality in Kandy District, in Sri Lanka\'s Central Province, roughly 10 km west-north-west of Kandy city centre and close to Nugawela and Ambatenna.' }, { question: 'What is near Hadeniya?', answer: 'Kandy city and Kandy Lake, the Royal Botanic Gardens at Peradeniya and the Mahaweli River at Gannoruwa are all a short drive away.' }] })

// ---- Meepe + Bandaragama: add nearby entries for the existing gallery landmarks
for (const [slug, names] of [['meepe', ['Former satellite earth station, Meepe', 'Padukka countryside']], ['bandaragama', ['Veedagama temple', 'Ingiriya (neighbouring town)', 'Ingiriya temple (neighbouring town)', 'Ingiriya bus halt (neighbouring town)', 'Small lake, Bandaragama']]] as const) {
  const d = await find(slug)
  const nearby: any[] = [...d.nearby]
  for (const n of names) if (!nearby.some((x) => x.name === n)) nearby.push({ category: 'Landmark', name: n })
  const gallery = d.gallery.map((g: any) => (g.landmark ? g : { ...g, landmark: 'Small lake, Bandaragama' }))
  await payload.update({ collection: 'neighborhoods', id: d.id, data: { nearby, gallery }, overrideAccess: true, depth: 0 })
  console.log(slug, 'nearby', nearby.length, 'gallery', gallery.length, gallery.every((g: any) => nearby.some((x) => x.name === g.landmark)))
}
process.exit(0)

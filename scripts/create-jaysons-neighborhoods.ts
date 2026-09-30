// Creates the 2 new neighbourhood pages (Nuwara Eliya, Ranna & Rekawa)
// needed for the Jaysons Realty import, using research verified this
// session (every Unsplash/Pexels photo's own location tag was checked via
// headless Chrome, not just search-result text — see chat for detail).
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

const nuwaraEliya = await payload.create({
  collection: 'neighborhoods',
  data: {
    slug: 'nuwara-eliya',
    name: 'Nuwara Eliya',
    city: 'Nuwara Eliya',
    province: 'Central',
    population: 'About 27,500 in the town/urban council area (2011/2012 census)',
    district: 'Nuwara Eliya District',
    approxLocation: "About 180 km from Colombo by road, roughly 4-5 hours' drive through the central hill country",
    nearbyAreas: ['Kandapola', 'Hakgala', 'Ambewela', 'Ramboda', 'Talawakele'],
    latitude: 6.9667,
    longitude: 80.7667,
    mapRadiusKm: 2,
    description:
      "Nuwara Eliya is a hill-country town in Sri Lanka's Central Province, set at about 1,868 metres above sea level beneath Pidurutalagala, the island's highest peak. British planters founded it in 1846 as a cool-climate retreat, and its Victorian-era racecourse, golf course and cottages earned it the nickname 'Little England.' Tea estates blanket the surrounding hills, and the town centres on Lake Gregory, a reservoir popular for boat rides and lakeside walks. Its cool, misty climate and colonial character set it apart from the rest of tropical Sri Lanka.",
    sources: [
      { label: 'Wikipedia — Nuwara Eliya', url: 'https://en.wikipedia.org/wiki/Nuwara_Eliya' },
      { label: 'Wikipedia — Nuwara Eliya District', url: 'https://en.wikipedia.org/wiki/Nuwara_Eliya_District' },
      { label: 'Wikipedia — Lake Gregory (Nuwara Eliya)', url: 'https://en.wikipedia.org/wiki/Lake_Gregory_(Nuwara_Eliya)' },
      { label: 'Wikipedia — Victoria Park, Nuwara Eliya', url: 'https://en.wikipedia.org/wiki/Victoria_Park,_Nuwara_Eliya' },
    ],
    faqs: [
      {
        question: 'What is Nuwara Eliya known for?',
        answer:
          "Nuwara Eliya is known as Sri Lanka's 'Little England' — a cool-climate hill station founded by British planters in 1846, with colonial-era architecture, a racecourse and golf course, surrounding tea estates, and Lake Gregory in the town centre. It's also a gateway to Horton Plains National Park.",
      },
      {
        question: 'Is Nuwara Eliya close to Colombo?',
        answer:
          "Not really — it's about 180 km from Colombo by road, and because the route climbs through the central hills the drive takes roughly 4-5 hours (longer by train or bus with a change at Nanu Oya).",
      },
    ],
    heroImage: 'https://media.lankanewhomes.com/neighborhoods/nuwara-eliya/nuwara-eliya_hero_lake-gregory.jpg',
    heroImageCredit: 'Photo: Saaketh PVR / Unsplash',
    heroImageSourceUrl: 'https://unsplash.com/photos/RG9VTsSH8Ow',
    highlights: [
      "1,868 m above sea level, one of Sri Lanka's highest towns",
      "Overlooked by Pidurutalagala, the island's tallest mountain",
      "Founded in 1846 as a British colonial hill station, nicknamed 'Little England'",
      "One of Sri Lanka's most important high-grown tea producing areas",
      'Lake Gregory, a reservoir built in 1873, anchors the town centre',
    ],
    gallery: [
      {
        url: 'https://media.lankanewhomes.com/neighborhoods/nuwara-eliya/nuwara-eliya_photo-1_hakgala-botanical-garden.jpg',
        caption: 'Flowering beds inside Hakgala Botanical Garden, on the slopes above Nuwara Eliya',
        credit: 'Photo: Missaka Prabashwara / Unsplash',
        sourceUrl: 'https://unsplash.com/photos/85PssJ5igO8',
        landmark: 'Hakgala Botanical Garden',
      },
      {
        url: 'https://media.lankanewhomes.com/neighborhoods/nuwara-eliya/nuwara-eliya_photo-2_hakgala-botanical-garden.jpg',
        caption: "Flowers in Hakgala Botanical Garden, Sri Lanka's second-largest botanical garden",
        credit: 'Photo: Udith Indrakantha / Unsplash',
        sourceUrl: 'https://unsplash.com/photos/XfSWpuhjXqQ',
        landmark: 'Hakgala Botanical Garden',
      },
      {
        url: 'https://media.lankanewhomes.com/neighborhoods/nuwara-eliya/nuwara-eliya_photo-3_tea-plantations.jpg',
        caption: 'Tea estates on the hillsides surrounding Nuwara Eliya',
        credit: 'Photo: Egle Sidaraviciute / Unsplash',
        sourceUrl: 'https://unsplash.com/photos/aerial-photo-of-field-ueBzLdRhhxQ',
        landmark: 'Tea plantations, Nuwara Eliya',
      },
      {
        url: 'https://media.lankanewhomes.com/neighborhoods/nuwara-eliya/nuwara-eliya_photo-4_tea-picker.jpg',
        caption: 'A tea picker at work in the hill country around Nuwara Eliya',
        credit: 'Photo: Sanjeewa Jayarathne / Pexels',
        sourceUrl: 'https://www.pexels.com/photo/23506595/',
        landmark: 'Tea plantations, Nuwara Eliya',
      },
    ],
  } as never,
  overrideAccess: true,
})
console.log('Neighborhood:', nuwaraEliya.id, nuwaraEliya.slug)

const rannaRekawa = await payload.create({
  collection: 'neighborhoods',
  data: {
    slug: 'ranna-rekawa',
    name: 'Ranna & Rekawa',
    city: 'Tangalle',
    province: 'Southern',
    population: "1,925 in the Ranna East Grama Niladhari division (2012 census)",
    district: 'Hambantota District',
    approxLocation: "About 195-200 km from Colombo by road via Tangalle, roughly 3.5-4 hours' drive; Rekawa is about 10 km east of Tangalle town",
    nearbyAreas: ['Netolpitiya', 'Tangalle', 'Ussangoda', 'Hungama', 'Kalametiya'],
    latitude: 6.07,
    longitude: 80.85,
    mapRadiusKm: 3,
    description:
      'Ranna and Rekawa are neighbouring villages on Sri Lanka\'s southern coast in Hambantota District, a few kilometres east of Tangalle. Ranna is a small fishing settlement of coconut palms and quiet beaches, while Rekawa is known internationally as one of the island\'s most important sea turtle nesting sites, where five species come ashore at night to lay eggs. Behind Rekawa\'s beach lies a shallow, mangrove-fringed lagoon rich in birdlife. The area remains rural and undeveloped, reached by a coastal side road off the Tangalle-Hambantota highway.',
    sources: [
      { label: 'Wikipedia — Rekawa Lagoon', url: 'https://en.wikipedia.org/wiki/Rekawa_Lagoon' },
      { label: 'Wikipedia — Tangalle', url: 'https://en.wikipedia.org/wiki/Tangalle' },
      { label: 'Turtle Conservation Project — Turtle Watch Rekawa', url: 'https://www.turtlewatchrekawa.org/' },
    ],
    faqs: [
      {
        question: 'What is Ranna & Rekawa known for?',
        answer:
          "Rekawa is one of Sri Lanka's most important sea turtle nesting beaches, protected since the mid-1990s by a community-run conservation project, alongside a mangrove-fringed lagoon rich in birdlife. Ranna, just along the same stretch of coast, is a quiet fishing and coconut-farming village with little tourism development.",
      },
      {
        question: 'Is Ranna & Rekawa close to Colombo?',
        answer:
          "No — it's about 195-200 km from Colombo by road, a drive of roughly 3.5-4 hours via the Southern Expressway to Matara and then the coast road, longer again by public bus.",
      },
    ],
    heroImage: 'https://media.lankanewhomes.com/neighborhoods/ranna-rekawa/ranna-rekawa_hero_ussangoda.jpg',
    heroImageCredit: 'Photo: Dilani Wickramanayake / Unsplash',
    heroImageSourceUrl: 'https://unsplash.com/photos/MIwxbJuDm_w',
    highlights: [
      'One of Sri Lanka\'s most important sea turtle nesting beaches (green, olive ridley, hawksbill, loggerhead and leatherback all recorded)',
      'Rekawa Lagoon: about 2.5 sq km, fringed by seven mangrove species',
      'Community-run turtle nest protection since 1995-96, fully community-managed since 2012',
      'About 10 km east of Tangalle along a quiet coastal side road',
    ],
    // Only 1 verified on-location photo found (see chat) — flagged to the
    // user rather than padded with mislabeled stock photos. Below the
    // site's usual >=5 standard; revisit if better sourcing turns up.
    gallery: [],
  } as never,
  overrideAccess: true,
})
console.log('Neighborhood:', rannaRekawa.id, rannaRekawa.slug)

process.exit(0)

// Content for the sample developer website (/web-design/sample). Everything
// here is fictional and illustrative — a made-up development, placeholder
// prices/distances/contact details — and the page says so. Photography is
// Unsplash (free licence), never a real project's renders.

const unsplash = (id: string, width: number) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${width}`;

export const SAMPLE_IMAGES = {
  hero: unsplash("1613490493576-7fde63acd811", 2200),
  intro: unsplash("1564013799919-ab600027ffc6", 1400),
  gallery: {
    garden: unsplash("1580587771525-78b9dba3b914", 1400),
    living: unsplash("1600607687939-ce8a6c25118c", 1400),
    kitchen: unsplash("1600585152220-90363fe7e115", 1400),
    pool: unsplash("1613977257363-707ba9348227", 1400),
    bath: unsplash("1600566752355-35792bedcfea", 1400),
    dining: unsplash("1600607687920-4e2a09cf159d", 1400),
  },
} as const;

export const SAMPLE_NAV = [
  { href: "#residences", label: "Residences" },
  { href: "#gallery", label: "Gallery" },
  { href: "#amenities", label: "Amenities" },
  { href: "#location", label: "Location" },
  { href: "#progress", label: "Progress" },
] as const;

export const SAMPLE_FACTS = [
  { value: "3 & 4 bedroom", label: "garden villas" },
  { value: "Gated", label: "community, 24-hour security" },
  { value: "Pool & clubhouse", label: "shared by residents" },
  { value: "Handover 20XX", label: "sample date" },
] as const;

export type SamplePlanRoom = { x: number; y: number; w: number; h: number; label: string };

export const SAMPLE_RESIDENCES: {
  key: string;
  name: string;
  bedrooms: string;
  size: string;
  blurb: string;
  rooms: SamplePlanRoom[];
}[] = [
  {
    key: "garden",
    name: "The Garden Villa",
    bedrooms: "3 bedrooms · 3 bathrooms",
    size: "1,850 sq ft",
    blurb: "An open living and dining room that steps straight out to a private garden.",
    rooms: [
      { x: 12, y: 12, w: 132, h: 92, label: "Living" },
      { x: 144, y: 12, w: 84, h: 92, label: "Dining" },
      { x: 228, y: 12, w: 60, h: 92, label: "Kitchen" },
      { x: 12, y: 104, w: 92, h: 74, label: "Bedroom 1" },
      { x: 104, y: 104, w: 92, h: 74, label: "Bedroom 2" },
      { x: 196, y: 104, w: 40, h: 74, label: "Bath" },
      { x: 236, y: 104, w: 52, h: 74, label: "Porch" },
    ],
  },
  {
    key: "terrace",
    name: "The Terrace Villa",
    bedrooms: "4 bedrooms · 4 bathrooms",
    size: "2,420 sq ft",
    blurb: "Four bedrooms over two floors, with a terrace above the garden for the evenings.",
    rooms: [
      { x: 12, y: 12, w: 124, h: 86, label: "Living" },
      { x: 136, y: 12, w: 72, h: 86, label: "Dining" },
      { x: 208, y: 12, w: 80, h: 86, label: "Kitchen" },
      { x: 12, y: 98, w: 84, h: 80, label: "Study" },
      { x: 96, y: 98, w: 84, h: 80, label: "Bedroom 4" },
      { x: 180, y: 98, w: 40, h: 80, label: "Bath" },
      { x: 220, y: 98, w: 68, h: 80, label: "Terrace" },
    ],
  },
  {
    key: "pool",
    name: "The Pool Villa",
    bedrooms: "4 bedrooms + study",
    size: "3,050 sq ft",
    blurb: "Our largest home: a private plunge pool, a study and a double-height living room.",
    rooms: [
      { x: 12, y: 12, w: 150, h: 88, label: "Double-height living" },
      { x: 162, y: 12, w: 126, h: 88, label: "Plunge pool" },
      { x: 12, y: 100, w: 70, h: 78, label: "Kitchen" },
      { x: 82, y: 100, w: 70, h: 78, label: "Study" },
      { x: 152, y: 100, w: 70, h: 78, label: "Master" },
      { x: 222, y: 100, w: 66, h: 78, label: "Deck" },
    ],
  },
];

export const SAMPLE_GALLERY: { src: string; alt: string; caption: string; wide?: boolean }[] = [
  { src: SAMPLE_IMAGES.gallery.garden, alt: "Garden elevation of a villa", caption: "The garden elevation", wide: true },
  { src: SAMPLE_IMAGES.gallery.living, alt: "Open-plan living room", caption: "Living & dining" },
  { src: SAMPLE_IMAGES.gallery.kitchen, alt: "Kitchen with island", caption: "Kitchen" },
  { src: SAMPLE_IMAGES.gallery.pool, alt: "Pool terrace", caption: "Pool terrace", wide: true },
  { src: SAMPLE_IMAGES.gallery.bath, alt: "Master bathroom", caption: "Master bathroom" },
  { src: SAMPLE_IMAGES.gallery.dining, alt: "Dining area and staircase", caption: "Dining & stair", wide: true },
];

export const SAMPLE_AMENITIES = [
  { icon: "waves", title: "Resident pool", body: "A 25-metre lap pool and a shallow children's end." },
  { icon: "dumbbell", title: "Clubhouse & gym", body: "Air-conditioned gym, yoga room and a residents' lounge." },
  { icon: "trees", title: "Landscaped gardens", body: "Mature trees and walking paths through the whole community." },
  { icon: "shield", title: "24-hour security", body: "Gated entrance, CCTV and staffed gatehouse." },
  { icon: "baby", title: "Children's play area", body: "A shaded play garden within sight of the clubhouse." },
  { icon: "plug", title: "EV-ready parking", body: "Covered parking with a charging point at every villa." },
  { icon: "coffee", title: "Café & co-working", body: "A quiet corner for coffee, calls and working from home." },
  { icon: "sun", title: "Solar-ready roofs", body: "Roofs designed to take solar panels from day one." },
] as const;

export const SAMPLE_NEARBY = [
  { name: "International school", time: "8 min" },
  { name: "Private hospital", time: "12 min" },
  { name: "Shopping mall", time: "10 min" },
  { name: "Expressway access", time: "15 min" },
  { name: "Wetland park", time: "5 min" },
] as const;

export const SAMPLE_PROGRESS = [
  { title: "Site prepared", state: "done" },
  { title: "Foundations", state: "done" },
  { title: "Structure", state: "current" },
  { title: "Finishes", state: "next" },
  { title: "Handover", state: "next" },
] as const;

export const SAMPLE_PAYMENT_STEPS = [
  { title: "Reserve", body: "Choose your villa and secure it with a booking deposit." },
  { title: "Agreement", body: "Sign the sale agreement and a clear payment schedule." },
  { title: "Stage payments", body: "Pay in instalments as construction reaches each stage." },
  { title: "Handover", body: "Final walk-through, keys and after-sales support." },
] as const;

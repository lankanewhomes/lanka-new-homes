// Content for the third sample developer website — "Azure Cove", beachfront
// villas. Same "fictional, illustrative" rules as Halcyon Residences (see
// sample-data.ts's header comment). A third distinct property type and
// identity: warm terracotta + deep ocean navy + sand, Fraunces + Work Sans —
// an editorial, resort feel, unlike Halcyon's garden-villa warmth or
// Meridian's cool urban minimalism.
import { Fraunces, Work_Sans } from "next/font/google";
import type { SampleTheme } from "./theme-types";

const unsplash = (id: string, width: number) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${width}`;

// See theme-meridian.ts's comment on why fonts are loaded per-theme here
// rather than in (sample)/layout.tsx.
const display = Fraunces({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--smp-font-display" });
const body = Work_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--smp-font-body" });

export const AZURE_COVE_THEME: SampleTheme = {
  id: "azure-cove",
  siteName: "Azure",
  siteNameSub: "Cove",
  fontVariables: `${display.variable} ${body.variable}`,
  metaTitle: "Azure Cove — sample website | LankaNewHomes Web Design",
  metaDescription: "A sample developer website by LankaNewHomes Web Design. Fictional development, illustrative content.",
  heroAriaLabel: "Azure Cove",
  locationLine: "Mirissa · Southern Province",
  heroHeadline: "Your own stretch of the shore.",
  heroSub: "Six beachfront villas and suites on Mirissa's quiet coast — a private beach, an infinity pool, and the ocean at your door.",
  images: {
    hero: unsplash("1540541338287-41700207dee6", 2200),
    intro: unsplash("1523217582562-09d0def993a6", 1400),
  },
  nav: [
    { href: "#residences", label: "Villas & suites" },
    { href: "#gallery", label: "Gallery" },
    { href: "#amenities", label: "Amenities" },
    { href: "#location", label: "Location" },
    { href: "#progress", label: "Progress" },
  ],
  facts: [
    { value: "1 & 2 bedroom", label: "beachfront villas & suites" },
    { value: "Private beach", label: "direct villa access" },
    { value: "Infinity pool", label: "& beach club restaurant" },
    { value: "Handover 20XX", label: "sample date" },
  ],
  introEyebrow: "The development",
  introHeading: "Six villas. One shoreline.",
  introBody:
    "Azure Cove sits directly on Mirissa's coast — six villas and suites built low and open to the ocean, with a private beach that's never shared with the public. Every home faces the water.",
  introChecks: ["Direct beach frontage, not a shared access path", "Open-plan living that faces the ocean", "A five-minute walk to Mirissa's harbour and old town"],
  residencesEyebrow: "Villas & suites",
  residencesHeading: "Three ways to be by the water.",
  residencesSub: "Choose the plan that fits your stay. Prices below are placeholders for the sample.",
  residences: [
    {
      key: "reef-suite",
      name: "The Reef Suite",
      bedrooms: "1 bedroom · 1 bathroom",
      size: "750 sq ft",
      blurb: "An open living-and-sleeping suite with a private sea-view deck, steps from the sand.",
      rooms: [
        { x: 12, y: 12, w: 180, h: 150, label: "Living / Bedroom" },
        { x: 204, y: 12, w: 84, h: 70, label: "Bath" },
        { x: 204, y: 90, w: 84, h: 72, label: "Sea-view deck" },
      ],
    },
    {
      key: "horizon-villa",
      name: "The Horizon Villa",
      bedrooms: "2 bedrooms · 2 bathrooms",
      size: "1,400 sq ft",
      blurb: "Two bedrooms, an open kitchen and a private plunge pool facing the water.",
      rooms: [
        { x: 12, y: 12, w: 130, h: 90, label: "Living / Dining" },
        { x: 154, y: 12, w: 60, h: 90, label: "Kitchen" },
        { x: 226, y: 12, w: 62, h: 90, label: "Plunge pool" },
        { x: 12, y: 110, w: 100, h: 68, label: "Bedroom 1" },
        { x: 120, y: 110, w: 100, h: 68, label: "Bedroom 2" },
        { x: 228, y: 110, w: 60, h: 68, label: "Deck" },
      ],
    },
    {
      key: "tidewater-villa",
      name: "The Tidewater Villa",
      bedrooms: "3 bedrooms · 3 bathrooms",
      size: "2,100 sq ft",
      blurb: "Our largest villa: direct beach frontage and a deck that runs the full width of the house.",
      rooms: [
        { x: 12, y: 12, w: 150, h: 88, label: "Living / Dining" },
        { x: 170, y: 12, w: 118, h: 88, label: "Beachfront deck" },
        { x: 12, y: 108, w: 70, h: 70, label: "Kitchen" },
        { x: 90, y: 108, w: 70, h: 70, label: "Bedroom 3" },
        { x: 168, y: 108, w: 60, h: 70, label: "Bedroom 2" },
        { x: 236, y: 108, w: 52, h: 70, label: "Master" },
      ],
    },
  ],
  galleryHeading: "Built to face the ocean.",
  gallery: [
    { src: unsplash("1584132967334-10e028bd69f7", 1400), alt: "Sun loungers on a deck over the ocean", caption: "Sun deck over the water", wide: true },
    { src: unsplash("1519046904884-53103b34b206", 1400), alt: "Pool among palm trees with mountains beyond", caption: "Pool among the palms" },
    { src: unsplash("1499793983690-e29da59ef1c2", 1400), alt: "Thatched pavilion on a sandbar in turquoise water", caption: "The overwater pavilion" },
    { src: unsplash("1520454974749-611b7248ffdb", 1400), alt: "Palm tree against a bright sky", caption: "Palm-lined shore", wide: true },
    { src: unsplash("1544551763-46a013bb70d5", 1400), alt: "Diver among reef fish", caption: "The reef, just offshore" },
    { src: unsplash("1520250497591-112f2f40a3f4", 1400), alt: "Resort pool with thatched cabanas", caption: "Poolside, under the palms" },
  ],
  amenitiesEyebrow: "Amenities",
  amenitiesHeading: "Resort amenities, without the resort crowd.",
  amenities: [
    { icon: "waves", title: "Private beach access", body: "A path straight from your villa to the sand, no public beach in between." },
    { icon: "sailboat", title: "Water sports centre", body: "Kayaks, paddleboards and snorkelling gear, free for residents." },
    { icon: "sun", title: "Infinity pool & sun deck", body: "An edge pool facing the ocean, open from sunrise to sunset." },
    { icon: "sparkles", title: "Spa pavilion", body: "Treatment rooms open to the sea breeze." },
    { icon: "utensils", title: "Beach club restaurant", body: "All-day dining a short walk from every villa." },
    { icon: "shield", title: "24-hour security", body: "A gated entrance and a staffed gatehouse, day and night." },
    { icon: "car", title: "Villa parking & buggy transfer", body: "Your own parking bay, plus a buggy service across the property." },
    { icon: "plug", title: "EV-ready parking", body: "A charging point at every villa, ready when you are." },
  ],
  locationEyebrow: "Location",
  locationHeading: "A short walk from Mirissa's harbour.",
  locationBody: "Distances are illustrative for the sample. On your site this section shows your real location and nearby places.",
  nearby: [
    { name: "Mirissa harbour", time: "5 min walk" },
    { name: "Whale-watching pier", time: "5 min walk" },
    { name: "Weligama Bay", time: "10 min" },
    { name: "Matara town", time: "20 min" },
    { name: "Southern Expressway", time: "15 min" },
  ],
  mapTitle: "Azure Cove",
  mapPois: [
    { x: 96, y: 96, t: "Mirissa harbour" },
    { x: 420, y: 100, t: "Whale pier" },
    { x: 120, y: 214, t: "Weligama Bay" },
    { x: 420, y: 222, t: "Matara town" },
  ],
  progressEyebrow: "Progress",
  progressHeading: "Watch it take shape.",
  progressSub: "Buyers can follow construction stage by stage — updated by your team.",
  progress: [
    { title: "Site prepared", state: "done" },
    { title: "Foundations", state: "done" },
    { title: "Structure", state: "current" },
    { title: "Interiors & pool", state: "next" },
    { title: "Handover", state: "next" },
  ],
  payHeading: "A payment plan that follows the build.",
  paymentSteps: [
    { title: "Reserve", body: "Choose your villa or suite and secure it with a booking deposit." },
    { title: "Agreement", body: "Sign the sale agreement and a clear payment schedule." },
    { title: "Stage payments", body: "Pay in instalments as construction reaches each stage." },
    { title: "Handover", body: "Final walk-through, keys and after-sales support." },
  ],
  enquireEyebrow: "Register your interest",
  enquireHeading: "Come and see it for yourself.",
  enquireBody:
    "Leave your details and our team will call to arrange a viewing — or message us on WhatsApp. Buyers overseas are welcome: choose your country code and we'll reach you there.",
  contactPhonePlaceholder: "+94 XX XXX XXXX",
  contactEmail: "hello@azurecove.lk",
  footerNote:
    "Sample website for a fictional development, designed by LankaNewHomes Web Design. All names, prices, distances and contact details are placeholders. Photography from Unsplash.",
};

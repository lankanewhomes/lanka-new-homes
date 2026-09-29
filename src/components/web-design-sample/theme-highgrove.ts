// Content for the fifth sample developer website — "Highgrove Estate",
// hillside villas set inside a working tea estate near Kandy. Same
// "fictional, illustrative" rules as the other samples (see sample-data.ts's
// header comment): made-up development, placeholder prices/distances/contact
// details, Unsplash photography, never a real project's renders.
// Deliberately a different property type and setting again (hill-country
// tea estate, not a garden/city/beach) and its own design identity (forest
// green + warm wood-brown, Newsreader + Karla).
import { Newsreader, Karla } from "next/font/google";
import type { SampleTheme } from "./theme-types";

const unsplash = (id: string, width: number) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${width}`;

const display = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--smp-font-display" });
const body = Karla({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--smp-font-body" });

export const HIGHGROVE_THEME: SampleTheme = {
  id: "highgrove",
  siteName: "Highgrove",
  siteNameSub: "Estate",
  fontVariables: `${display.variable} ${body.variable}`,
  metaTitle: "Highgrove Estate — sample website | LankaNewHomes Web Design",
  metaDescription: "A sample developer website by LankaNewHomes Web Design. Fictional development, illustrative content.",
  heroAriaLabel: "Highgrove Estate",
  locationLine: "Pussellawa · Kandy District",
  heroHeadline: "Wake up in the clouds.",
  heroSub: "Eight hillside villas among working tea gardens in Pussellawa — mist in the mornings, the valley below, forty minutes from Kandy.",
  images: {
    hero: unsplash("1748753778598-2e5c4244e90e", 2200),
    intro: unsplash("1770839012421-7423ddd0a105", 1400),
  },
  nav: [
    { href: "#residences", label: "Residences" },
    { href: "#gallery", label: "Gallery" },
    { href: "#amenities", label: "Amenities" },
    { href: "#location", label: "Location" },
    { href: "#progress", label: "Progress" },
  ],
  facts: [
    { value: "3 & 4 bedroom", label: "hillside villas" },
    { value: "Eight villas", label: "on a working tea estate" },
    { value: "Infinity pool", label: "overlooking the valley" },
    { value: "Handover 20XX", label: "sample date" },
  ],
  introEyebrow: "The estate",
  introHeading: "Living inside a working tea garden.",
  introBody:
    "Highgrove sits on eight acres of an active tea estate in Pussellawa, sharing the hillside with the pluckers who work it every morning. Each villa is placed to catch the mist and the view, not to fit as many as possible onto the slope.",
  introChecks: ["Eight villas across eight acres", "A working tea estate, not a cleared plot", "Forty minutes to Kandy"],
  residencesEyebrow: "Residences",
  residencesHeading: "Three ways to live on the hillside.",
  residencesSub: "Choose the plan that fits your family. Prices below are placeholders for the sample.",
  residences: [
    {
      key: "tea-house",
      name: "The Tea House Villa",
      bedrooms: "3 bedrooms · 3 bathrooms",
      size: "1,750 sq ft",
      blurb: "An open living and dining room that steps straight out to your own veranda over the tea rows.",
      rooms: [
        { x: 12, y: 12, w: 132, h: 92, label: "Living" },
        { x: 144, y: 12, w: 84, h: 92, label: "Dining" },
        { x: 228, y: 12, w: 60, h: 92, label: "Kitchen" },
        { x: 12, y: 104, w: 92, h: 74, label: "Bedroom 1" },
        { x: 104, y: 104, w: 92, h: 74, label: "Bedroom 2" },
        { x: 196, y: 104, w: 40, h: 74, label: "Bath" },
        { x: 236, y: 104, w: 52, h: 74, label: "Veranda" },
      ],
    },
    {
      key: "ridge",
      name: "The Ridge Villa",
      bedrooms: "3 bedrooms · 3 bathrooms",
      size: "2,100 sq ft",
      blurb: "A single level that opens onto its own terrace, looking straight down the ridge.",
      rooms: [
        { x: 12, y: 12, w: 124, h: 86, label: "Living" },
        { x: 136, y: 12, w: 72, h: 86, label: "Dining" },
        { x: 208, y: 12, w: 80, h: 86, label: "Kitchen" },
        { x: 12, y: 98, w: 84, h: 80, label: "Study" },
        { x: 96, y: 98, w: 84, h: 80, label: "Bedroom 3" },
        { x: 180, y: 98, w: 40, h: 80, label: "Bath" },
        { x: 220, y: 98, w: 68, h: 80, label: "Terrace" },
      ],
    },
    {
      key: "valley-view",
      name: "The Valley View Villa",
      bedrooms: "4 bedrooms + study",
      size: "3,200 sq ft",
      blurb: "Our largest villa: a double-height living room and an infinity pool that seems to spill into the valley.",
      rooms: [
        { x: 12, y: 12, w: 150, h: 88, label: "Double-height living" },
        { x: 162, y: 12, w: 126, h: 88, label: "Infinity pool" },
        { x: 12, y: 100, w: 70, h: 78, label: "Kitchen" },
        { x: 82, y: 100, w: 70, h: 78, label: "Study" },
        { x: 152, y: 100, w: 70, h: 78, label: "Master" },
        { x: 222, y: 100, w: 66, h: 78, label: "Viewing deck" },
      ],
    },
  ],
  galleryHeading: "Mist in the morning, mountains all day.",
  gallery: [
    { src: unsplash("1756286477454-258a405f19fe", 1400), alt: "Tea pluckers working among rows of tea bushes", caption: "The estate, still working", wide: true },
    { src: unsplash("1761319914911-71b059a655d8", 1400), alt: "Cozy living room with a fireplace and large windows", caption: "Living room" },
    { src: unsplash("1692386550366-ab5e50ba3b51", 1400), alt: "Bedroom with a view of a mountain range", caption: "Bedroom view" },
    { src: unsplash("1756244866467-f4682840070c", 1400), alt: "Infinity pool overlooking misty mountains and a valley", caption: "The infinity pool", wide: true },
  ],
  amenitiesEyebrow: "Amenities",
  amenitiesHeading: "Everything a hill station rarely gets right.",
  amenities: [
    { icon: "waves", title: "Infinity pool", body: "Heated for cooler mornings, looking straight down the valley." },
    { icon: "sun", title: "Fireplace in every villa", body: "Cold hill-country evenings, without leaving the living room." },
    { icon: "trees", title: "Guided estate walks", body: "Morning walks through the working tea garden, led by estate staff." },
    { icon: "shield", title: "24-hour security", body: "A gated entrance and staffed gatehouse, same as the estate itself." },
    { icon: "car", title: "Covered parking", body: "One covered space per villa, with room for a second car outside." },
    { icon: "plug", title: "Backup generator", body: "Estate-wide backup power for the hill country's occasional outages." },
    { icon: "coffee", title: "Estate café", body: "A small café at the factory gate, serving the estate's own tea." },
    { icon: "sparkles", title: "Housekeeping on request", body: "Weekly or daily housekeeping, arranged through the estate office." },
  ],
  locationEyebrow: "Location",
  locationHeading: "Forty minutes from Kandy, a world away from it.",
  locationBody: "Distances are illustrative for the sample. On your site this section shows your real location and nearby places.",
  nearby: [
    { name: "Kandy town", time: "40 min" },
    { name: "Pussellawa town", time: "10 min" },
    { name: "Ramboda Falls", time: "15 min" },
    { name: "Nuwara Eliya", time: "45 min" },
    { name: "Nearest hospital", time: "20 min" },
  ],
  mapTitle: "Highgrove Estate",
  mapPois: [
    { x: 96, y: 96, t: "Pussellawa town" },
    { x: 420, y: 100, t: "Ramboda Falls" },
    { x: 120, y: 214, t: "Kandy road" },
    { x: 420, y: 222, t: "Nearest hospital" },
  ],
  progressEyebrow: "Progress",
  progressHeading: "See the estate take shape.",
  progressSub: "Buyers can follow construction stage by stage — updated by your team.",
  progress: [
    { title: "Site prepared", state: "done" },
    { title: "Access road", state: "done" },
    { title: "Foundations", state: "current" },
    { title: "Structure & roofing", state: "next" },
    { title: "Handover", state: "next" },
  ],
  payHeading: "A payment plan that follows the build.",
  paymentSteps: [
    { title: "Reserve", body: "Choose your villa and secure it with a booking deposit." },
    { title: "Agreement", body: "Sign the sale agreement and a clear payment schedule." },
    { title: "Stage payments", body: "Pay in instalments as construction reaches each stage." },
    { title: "Handover", body: "Final walk-through, keys and after-sales support." },
  ],
  enquireEyebrow: "Register your interest",
  enquireHeading: "Come and see the estate.",
  enquireBody:
    "Leave your details and our sales team will call you to arrange a visit — or message us on WhatsApp. Buyers overseas are welcome: choose your country code and we'll reach you there.",
  contactPhonePlaceholder: "+94 XX XXX XXXX",
  contactEmail: "hello@highgroveestate.lk",
  footerNote:
    "Sample website for a fictional development, designed by LankaNewHomes Web Design. All names, prices, distances and contact details are placeholders. Photography from Unsplash.",
};

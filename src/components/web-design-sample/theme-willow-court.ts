// Content for the sixth sample developer website — "Willow Court", a
// mid-market gated townhouse community for families. Same "fictional,
// illustrative" rules as the other samples (see sample-data.ts's header
// comment): made-up development, placeholder prices/distances/contact
// details, Unsplash photography, never a real project's renders.
// Deliberately a different buyer segment from the rest of the set — friendly
// and mid-market rather than luxury — with its own design identity (sage
// green + mustard, Poppins + Source Sans 3).
import { poppinsWillow as display, sourceSansWillow as body } from "@/lib/local-fonts";
import type { SampleTheme } from "./theme-types";

const unsplash = (id: string, width: number) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${width}`;


export const WILLOW_COURT_THEME: SampleTheme = {
  id: "willow-court",
  siteName: "Willow",
  siteNameSub: "Court",
  fontVariables: `${display.variable} ${body.variable}`,
  metaTitle: "Willow Court — sample website | LankaNewHomes Web Design",
  metaDescription: "A sample developer website by LankaNewHomes Web Design. Fictional development, illustrative content.",
  heroAriaLabel: "Willow Court",
  locationLine: "Kottawa · Colombo",
  heroHeadline: "Room to grow, right where you need to be.",
  heroSub: "Eighteen three- and four-bedroom townhouses in a gated community in Kottawa — a garden of your own, ten minutes from the highway.",
  images: {
    hero: unsplash("1756534919400-8b2562d76fe6", 2200),
    intro: unsplash("1761839258657-457dda39b5cc", 1400),
  },
  nav: [
    { href: "#residences", label: "Residences" },
    { href: "#gallery", label: "Gallery" },
    { href: "#amenities", label: "Amenities" },
    { href: "#location", label: "Location" },
    { href: "#progress", label: "Progress" },
  ],
  facts: [
    { value: "3 & 4 bedroom", label: "townhouses" },
    { value: "Gated", label: "community of eighteen homes" },
    { value: "Kids' play area", label: "and a community hall" },
    { value: "Handover 20XX", label: "sample date" },
  ],
  introEyebrow: "The community",
  introHeading: "Built for a family that's still growing.",
  introBody:
    "Willow Court is eighteen townhouses around a shared green in Kottawa — close enough to the highway for the commute, quiet enough for the kids to play outside. Every home has its own small garden, not just a balcony.",
  introChecks: ["Eighteen townhouses, three layouts", "A private garden with every home", "Ten minutes to the outer circular highway"],
  residencesEyebrow: "Residences",
  residencesHeading: "Three layouts. Room to grow into any of them.",
  residencesSub: "Choose the plan that fits your family. Prices below are placeholders for the sample.",
  residences: [
    {
      key: "starter",
      name: "The Starter Townhouse",
      bedrooms: "3 bedrooms · 2 bathrooms",
      size: "1,450 sq ft",
      blurb: "An open living and dining room with a small private garden out back.",
      rooms: [
        { x: 12, y: 12, w: 132, h: 92, label: "Living" },
        { x: 144, y: 12, w: 84, h: 92, label: "Dining" },
        { x: 228, y: 12, w: 60, h: 92, label: "Kitchen" },
        { x: 12, y: 104, w: 92, h: 74, label: "Bedroom 1" },
        { x: 104, y: 104, w: 92, h: 74, label: "Bedroom 2" },
        { x: 196, y: 104, w: 40, h: 74, label: "Bath" },
        { x: 236, y: 104, w: 52, h: 74, label: "Garden" },
      ],
    },
    {
      key: "family",
      name: "The Family Townhouse",
      bedrooms: "4 bedrooms · 3 bathrooms",
      size: "1,850 sq ft",
      blurb: "Four bedrooms over two floors, with a study that doubles as a playroom.",
      rooms: [
        { x: 12, y: 12, w: 124, h: 86, label: "Living" },
        { x: 136, y: 12, w: 72, h: 86, label: "Dining" },
        { x: 208, y: 12, w: 80, h: 86, label: "Kitchen" },
        { x: 12, y: 98, w: 84, h: 80, label: "Study / playroom" },
        { x: 96, y: 98, w: 84, h: 80, label: "Bedroom 4" },
        { x: 180, y: 98, w: 40, h: 80, label: "Bath" },
        { x: 220, y: 98, w: 68, h: 80, label: "Balcony" },
      ],
    },
    {
      key: "corner",
      name: "The Corner Townhouse",
      bedrooms: "4 bedrooms + study",
      size: "2,050 sq ft",
      blurb: "Our largest layout: a corner plot with garden on two sides and a home office.",
      rooms: [
        { x: 12, y: 12, w: 150, h: 88, label: "Living / dining" },
        { x: 162, y: 12, w: 126, h: 88, label: "Side garden" },
        { x: 12, y: 100, w: 70, h: 78, label: "Kitchen" },
        { x: 82, y: 100, w: 70, h: 78, label: "Home office" },
        { x: 152, y: 100, w: 70, h: 78, label: "Master" },
        { x: 222, y: 100, w: 66, h: 78, label: "Patio" },
      ],
    },
  ],
  galleryHeading: "Everyday, made easier.",
  gallery: [
    { src: unsplash("1737898415581-7dea57a1905b", 1400), alt: "Open-plan kitchen and living area", caption: "Kitchen & living", wide: true },
    { src: unsplash("1687946803051-51da173a9f55", 1400), alt: "Colourful children's playroom", caption: "A room for the kids" },
    { src: unsplash("1715090576114-c07384af2069", 1400), alt: "Small back patio with seating", caption: "The back garden" },
    { src: unsplash("1682101282433-2869e63d74c7", 1400), alt: "Community playground with a slide", caption: "The community playground", wide: true },
  ],
  amenitiesEyebrow: "Amenities",
  amenitiesHeading: "Everything a family actually uses.",
  amenities: [
    { icon: "baby", title: "Children's play area", body: "A fenced play area within sight of every home on the green." },
    { icon: "trees", title: "Shared green", body: "A landscaped green at the centre of the community, not just a driveway." },
    { icon: "shield", title: "24-hour security", body: "Gated entrance, CCTV and a staffed gatehouse." },
    { icon: "car", title: "Visitor parking", body: "Dedicated visitor bays, so guests aren't blocking your driveway." },
    { icon: "sun", title: "Solar water heating", body: "Fitted as standard in every townhouse." },
    { icon: "plug", title: "Backup generator", body: "Community-wide backup power for outages." },
    { icon: "coffee", title: "Community hall", body: "A shared hall for birthdays, meetings and everything in between." },
    { icon: "wifi", title: "Fibre-ready", body: "Ducting for fibre broadband run to every townhouse." },
  ],
  locationEyebrow: "Location",
  locationHeading: "Ten minutes from the highway, five from school.",
  locationBody: "Distances are illustrative for the sample. On your site this section shows your real location and nearby places.",
  nearby: [
    { name: "Kottawa highway entrance", time: "10 min" },
    { name: "International school", time: "5 min" },
    { name: "Private hospital", time: "12 min" },
    { name: "Supermarket", time: "4 min" },
    { name: "Pannipitiya town", time: "8 min" },
  ],
  mapTitle: "Willow Court",
  mapPois: [
    { x: 96, y: 96, t: "Int'l school" },
    { x: 420, y: 100, t: "Highway entrance" },
    { x: 120, y: 214, t: "Supermarket" },
    { x: 420, y: 222, t: "Private hospital" },
  ],
  progressEyebrow: "Progress",
  progressHeading: "Follow the build, street by street.",
  progressSub: "Buyers can follow construction stage by stage — updated by your team.",
  progress: [
    { title: "Site prepared", state: "done" },
    { title: "Foundations", state: "done" },
    { title: "Structure", state: "current" },
    { title: "Finishes", state: "next" },
    { title: "Handover", state: "next" },
  ],
  payHeading: "A payment plan that follows the build.",
  paymentSteps: [
    { title: "Reserve", body: "Choose your townhouse and secure it with a booking deposit." },
    { title: "Agreement", body: "Sign the sale agreement and a clear payment schedule." },
    { title: "Stage payments", body: "Pay in instalments as construction reaches each stage." },
    { title: "Handover", body: "Final walk-through, keys and after-sales support." },
  ],
  enquireEyebrow: "Register your interest",
  enquireHeading: "Come and see a show townhouse.",
  enquireBody:
    "Leave your details and our sales team will call you to arrange a visit — or message us on WhatsApp. Buyers overseas are welcome: choose your country code and we'll reach you there.",
  contactPhonePlaceholder: "+94 XX XXX XXXX",
  contactEmail: "hello@willowcourt.lk",
  footerNote:
    "Sample website for a fictional development, designed by LankaNewHomes Web Design. All names, prices, distances and contact details are placeholders. Photography from Unsplash.",
};

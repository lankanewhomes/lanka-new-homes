// Content for the fourth sample developer website — "Obsidian Villas", a
// black-and-white architectural villa development. Same "fictional,
// illustrative" rules as the other samples (see sample-data.ts's header
// comment): made-up development, placeholder prices/distances/contact
// details, never a real project's renders. Owner, 2026-09-28: "create a
// black and white website also".
//
// Deliberately monochrome rather than just "another colour palette" — every
// photo on this theme is rendered through a CSS grayscale filter
// ([data-theme="obsidian"] img in sample.css), so the images below are
// reused from the other three themes' own (colour) photo sets on purpose:
// once desaturated they read as completely different photography, and it
// keeps this sample honest about being illustrative rather than sourcing
// yet another dozen stock photos for a look that's defined by its absence
// of colour, not by which building is pictured.
import { archivoObsidian as display, manropeObsidian as body } from "@/lib/local-fonts";
import type { SampleTheme } from "./theme-types";

const unsplash = (id: string, width: number) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${width}`;


export const OBSIDIAN_THEME: SampleTheme = {
  id: "obsidian",
  siteName: "Obsidian",
  siteNameSub: "Villas",
  fontVariables: `${display.variable} ${body.variable}`,
  metaTitle: "Obsidian Villas — sample website | LankaNewHomes Web Design",
  metaDescription: "A sample developer website by LankaNewHomes Web Design. Fictional development, illustrative content.",
  heroAriaLabel: "Obsidian Villas",
  locationLine: "Pelawatte · Colombo",
  heroHeadline: "Architecture, uncompromised.",
  heroSub: "Six sculptural villas in Pelawatte — poured concrete, black steel and glass, built around light and shadow rather than colour.",
  images: {
    hero: unsplash("1613490493576-7fde63acd811", 2200),
    intro: unsplash("1564013799919-ab600027ffc6", 1400),
  },
  nav: [
    { href: "#residences", label: "Residences" },
    { href: "#gallery", label: "Gallery" },
    { href: "#amenities", label: "Amenities" },
    { href: "#location", label: "Location" },
    { href: "#progress", label: "Progress" },
  ],
  facts: [
    { value: "4 & 5 bedroom", label: "architectural villas" },
    { value: "Six villas only", label: "private, gated estate" },
    { value: "Concrete & glass", label: "poured in place" },
    { value: "Handover 20XX", label: "sample date" },
  ],
  introEyebrow: "The development",
  introHeading: "Nothing added that doesn't need to be there.",
  introBody:
    "Obsidian is six villas, each planned around a private courtyard rather than a shared garden. The material palette is deliberately narrow — board-formed concrete, black steel, glass — so the architecture reads as one idea carried through, not a collection of finishes.",
  introChecks: ["Six villas, no two identical", "A private courtyard for every villa", "Structured cabling for a smart home system of your choice"],
  residencesEyebrow: "Residences",
  residencesHeading: "Three plans. One material language.",
  residencesSub: "Choose the plan that fits your family. Prices below are placeholders for the sample.",
  residences: [
    {
      key: "monolith",
      name: "The Monolith",
      bedrooms: "4 bedrooms · 4 bathrooms",
      size: "2,900 sq ft",
      blurb: "A single-volume house organised around one great room, with a private courtyard instead of a front garden.",
      rooms: [
        { x: 12, y: 12, w: 132, h: 92, label: "Great room" },
        { x: 144, y: 12, w: 84, h: 92, label: "Dining" },
        { x: 228, y: 12, w: 60, h: 92, label: "Kitchen" },
        { x: 12, y: 104, w: 92, h: 74, label: "Bedroom 1" },
        { x: 104, y: 104, w: 92, h: 74, label: "Bedroom 2" },
        { x: 196, y: 104, w: 40, h: 74, label: "Bath" },
        { x: 236, y: 104, w: 52, h: 74, label: "Courtyard" },
      ],
    },
    {
      key: "courtyard",
      name: "The Courtyard House",
      bedrooms: "4 bedrooms + study",
      size: "3,400 sq ft",
      blurb: "Four bedrooms wrapped around a central courtyard that brings light into every room, even at the centre of the plan.",
      rooms: [
        { x: 12, y: 12, w: 124, h: 86, label: "Living" },
        { x: 136, y: 12, w: 72, h: 86, label: "Dining" },
        { x: 208, y: 12, w: 80, h: 86, label: "Kitchen" },
        { x: 12, y: 98, w: 84, h: 80, label: "Study" },
        { x: 96, y: 98, w: 84, h: 80, label: "Bedroom 2" },
        { x: 180, y: 98, w: 40, h: 80, label: "Bath" },
        { x: 220, y: 98, w: 68, h: 80, label: "Courtyard" },
      ],
    },
    {
      key: "pavilion",
      name: "The Glass Pavilion",
      bedrooms: "5 bedrooms + study",
      size: "4,100 sq ft",
      blurb: "Our largest villa: a double-height glazed living room facing a private reflecting pool.",
      rooms: [
        { x: 12, y: 12, w: 150, h: 88, label: "Double-height living" },
        { x: 162, y: 12, w: 126, h: 88, label: "Reflecting pool" },
        { x: 12, y: 100, w: 70, h: 78, label: "Kitchen" },
        { x: 82, y: 100, w: 70, h: 78, label: "Study" },
        { x: 152, y: 100, w: 70, h: 78, label: "Master" },
        { x: 222, y: 100, w: 66, h: 78, label: "Deck" },
      ],
    },
  ],
  galleryHeading: "Concrete, steel, glass — and nothing else.",
  gallery: [
    { src: unsplash("1486406146926-c627a92ad1ab", 1400), alt: "Looking up at an angular concrete structure", caption: "The stairwell, looking up", wide: true },
    { src: unsplash("1600607687939-ce8a6c25118c", 1400), alt: "Open-plan living room", caption: "Living room" },
    { src: unsplash("1600585152220-90363fe7e115", 1400), alt: "Kitchen with island", caption: "Kitchen" },
    { src: unsplash("1600585154526-990dced4db0d", 1400), alt: "Building entrance lit at dusk", caption: "Entrance at dusk", wide: true },
    { src: unsplash("1613977257363-707ba9348227", 1400), alt: "Reflecting pool at dusk", caption: "The reflecting pool" },
    { src: unsplash("1600566752355-35792bedcfea", 1400), alt: "Master bathroom", caption: "Master bathroom" },
  ],
  amenitiesEyebrow: "Amenities",
  amenitiesHeading: "Private by design, not by add-on.",
  amenities: [
    { icon: "shield", title: "24-hour security", body: "Gated entrance and discreet CCTV coverage across the estate." },
    { icon: "waves", title: "A pool of your own", body: "Every villa has its own reflecting or plunge pool — never a shared one." },
    { icon: "car", title: "Basement parking", body: "Covered parking for two cars per villa, off the street." },
    { icon: "plug", title: "EV charging", body: "A charging point built into every villa's parking bay." },
    { icon: "film", title: "Home cinema pre-wired", body: "Structured cabling for a home cinema or media room, ready to fit out." },
    { icon: "trees", title: "A private courtyard", body: "Every villa is organised around its own courtyard, not a shared garden." },
    { icon: "sparkles", title: "Smart home wiring", body: "Lighting, security and climate pre-wired for a smart home system of your choice." },
    { icon: "sun", title: "Solar-ready roofs", body: "Roofs engineered to take solar panels from day one." },
  ],
  locationEyebrow: "Location",
  locationHeading: "Quiet, and still close to everything.",
  locationBody: "Distances are illustrative for the sample. On your site this section shows your real location and nearby places.",
  nearby: [
    { name: "International school", time: "10 min" },
    { name: "Private hospital", time: "12 min" },
    { name: "Parkland", time: "6 min" },
    { name: "Expressway access", time: "9 min" },
    { name: "Colombo city centre", time: "20 min" },
  ],
  mapTitle: "Obsidian Villas",
  mapPois: [
    { x: 96, y: 96, t: "Parkland" },
    { x: 420, y: 100, t: "Expressway" },
    { x: 120, y: 214, t: "Int'l school" },
    { x: 420, y: 222, t: "Private hospital" },
  ],
  progressEyebrow: "Progress",
  progressHeading: "See it being built.",
  progressSub: "Buyers can follow construction stage by stage — updated by your team.",
  progress: [
    { title: "Site prepared", state: "done" },
    { title: "Foundations", state: "done" },
    { title: "Concrete structure", state: "current" },
    { title: "Facade & glazing", state: "next" },
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
  enquireHeading: "Come and see a completed villa.",
  enquireBody:
    "Leave your details and our sales team will call you to arrange a visit — or message us on WhatsApp. Buyers overseas are welcome: choose your country code and we'll reach you there.",
  contactPhonePlaceholder: "+94 XX XXX XXXX",
  contactEmail: "hello@obsidianvillas.lk",
  footerNote:
    "Sample website for a fictional development, designed by LankaNewHomes Web Design. All names, prices, distances and contact details are placeholders. Photography from Unsplash.",
};

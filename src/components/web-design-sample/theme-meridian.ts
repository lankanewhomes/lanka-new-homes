// Content for the second sample developer website — "Meridian Heights", a
// high-rise apartment tower. Same "fictional, illustrative" rules as
// Halcyon Residences (see sample-data.ts's header comment): made-up
// development, placeholder prices/distances/contact details, Unsplash
// photography, never a real project's renders. Deliberately a different
// property type (apartments, not villas) and a different design identity
// (cool steel-blue + electric teal, Space Grotesk + Inter) so the sample
// genuinely looks like a different developer's site, not a recolour of
// Halcyon's.
import { spaceGroteskMeridian as display, interMeridian as body } from "@/lib/local-fonts";
import type { SampleTheme } from "./theme-types";

const unsplash = (id: string, width: number) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${width}`;

// Loaded here (not in a layout) so this theme's route can sit alongside
// Halcyon's under the same (sample) root layout without fighting over which
// font <html> gets — the page wraps its content in a div carrying these
// `.variable` classes, which shadows the outer (Halcyon) font variables for
// everything inside it. See web-design/sample/meridian/page.tsx.

export const MERIDIAN_THEME: SampleTheme = {
  id: "meridian",
  siteName: "Meridian",
  siteNameSub: "Heights",
  fontVariables: `${display.variable} ${body.variable}`,
  metaTitle: "Meridian Heights — sample website | LankaNewHomes Web Design",
  metaDescription: "A sample developer website by LankaNewHomes Web Design. Fictional development, illustrative content.",
  heroAriaLabel: "Meridian Heights",
  locationLine: "Rajagiriya · Colombo",
  heroHeadline: "Wake up above the city.",
  heroSub: "A 28-storey address in the heart of Colombo — studios to three-bedroom penthouses, five minutes from everywhere that matters.",
  images: {
    hero: unsplash("1487958449943-2429e8be8625", 2200),
    intro: unsplash("1545324418-cc1a3fa10c00", 1400),
  },
  nav: [
    { href: "#residences", label: "Residences" },
    { href: "#gallery", label: "Gallery" },
    { href: "#amenities", label: "Amenities" },
    { href: "#location", label: "Location" },
    { href: "#progress", label: "Progress" },
  ],
  facts: [
    { value: "Studio – 3 bed", label: "apartments & penthouses" },
    { value: "28 storeys", label: "over Colombo's skyline" },
    { value: "Sky lounge & gym", label: "on the rooftop" },
    { value: "Handover 20XX", label: "sample date" },
  ],
  introEyebrow: "The tower",
  introHeading: "Built for the way the city moves.",
  introBody:
    "Meridian Heights rises 28 storeys above Rajagiriya — a fast commute in, and a quiet address to come home to. Every apartment is designed for natural light and cross-breeze, with a private balcony looking out over the city or the hills beyond.",
  introChecks: ["Studio to 3-bedroom penthouse layouts", "Floor-to-ceiling glazing in every unit", "Five minutes to the outer circular expressway"],
  residencesEyebrow: "Residences",
  residencesHeading: "Three ways to live above the city.",
  residencesSub: "Choose your floor plan. Prices below are placeholders for the sample.",
  residences: [
    {
      key: "studio",
      name: "The Skyline Studio",
      bedrooms: "Studio · 1 bathroom",
      size: "550 sq ft",
      blurb: "A fully open-plan home with a private balcony — an efficient footprint that doesn't feel small.",
      rooms: [
        { x: 12, y: 12, w: 196, h: 150, label: "Living / Kitchen" },
        { x: 216, y: 12, w: 72, h: 70, label: "Bath" },
        { x: 216, y: 90, w: 72, h: 72, label: "Balcony" },
      ],
    },
    {
      key: "two-bed",
      name: "The Two-Bedroom",
      bedrooms: "2 bedrooms · 2 bathrooms",
      size: "980 sq ft",
      blurb: "A separate kitchen, two real bedrooms and a balcony wide enough for a table and chairs.",
      rooms: [
        { x: 12, y: 12, w: 140, h: 90, label: "Living / Dining" },
        { x: 160, y: 12, w: 60, h: 90, label: "Kitchen" },
        { x: 228, y: 12, w: 60, h: 90, label: "Balcony" },
        { x: 12, y: 110, w: 100, h: 68, label: "Bedroom 1" },
        { x: 120, y: 110, w: 88, h: 68, label: "Bedroom 2" },
        { x: 216, y: 110, w: 72, h: 68, label: "Bath x2" },
      ],
    },
    {
      key: "penthouse",
      name: "The Penthouse",
      bedrooms: "3 bedrooms + study",
      size: "1,650 sq ft",
      blurb: "Our top-floor layout: a private terrace, a home study and the best view in the building.",
      rooms: [
        { x: 12, y: 12, w: 150, h: 88, label: "Living / Dining" },
        { x: 170, y: 12, w: 118, h: 88, label: "Private terrace" },
        { x: 12, y: 108, w: 70, h: 70, label: "Kitchen" },
        { x: 90, y: 108, w: 70, h: 70, label: "Study" },
        { x: 168, y: 108, w: 60, h: 70, label: "Bedroom 3" },
        { x: 236, y: 108, w: 52, h: 70, label: "Master" },
      ],
    },
  ],
  galleryHeading: "The building, inside and out.",
  gallery: [
    { src: unsplash("1486406146926-c627a92ad1ab", 1400), alt: "Looking up at glass towers", caption: "Looking up from the plaza", wide: true },
    { src: unsplash("1560448204-e02f11c3d0e2", 1400), alt: "Bright modern living room", caption: "Living room" },
    { src: unsplash("1571003123894-1f0594d2b5d9", 1400), alt: "Living room with fireplace and lake view", caption: "Dining & lounge" },
    { src: unsplash("1600585154526-990dced4db0d", 1400), alt: "Modern building entrance lit at dusk", caption: "Entrance at dusk", wide: true },
    { src: unsplash("1502672260266-1c1ef2d93688", 1400), alt: "Cosy lounge with plants", caption: "Residents' lounge" },
    { src: unsplash("1449824913935-59a10b8d2000", 1400), alt: "City street with skyscrapers", caption: "The city at your door" },
  ],
  amenitiesEyebrow: "Amenities",
  amenitiesHeading: "A rooftop that does the work of a resort.",
  amenities: [
    { icon: "waves", title: "Infinity pool", body: "A rooftop infinity pool overlooking the city skyline." },
    { icon: "sparkles", title: "Sky lounge", body: "A shared terrace with BBQ pits and skyline views, open to residents." },
    { icon: "dumbbell", title: "Fitness studio", body: "A full-floor gym with a dedicated yoga room." },
    { icon: "wifi", title: "Co-working lounge", body: "Quiet desks and meeting pods, fibre wifi throughout." },
    { icon: "film", title: "Private cinema", body: "A small screening room, bookable by residents." },
    { icon: "shield", title: "24-hour concierge", body: "A manned lobby, CCTV and keycard access on every floor." },
    { icon: "car", title: "Basement parking", body: "One covered space per apartment, visitor parking on request." },
    { icon: "plug", title: "EV charging", body: "Dedicated charging bays in the basement car park." },
  ],
  locationEyebrow: "Location",
  locationHeading: "Five minutes from everywhere that matters.",
  locationBody: "Distances are illustrative for the sample. On your site this section shows your real location and nearby places.",
  nearby: [
    { name: "One Galle Face Mall", time: "6 min" },
    { name: "Rajagiriya rail halt", time: "4 min" },
    { name: "Outer circular expressway", time: "5 min" },
    { name: "National Hospital", time: "9 min" },
    { name: "Independence Square", time: "8 min" },
  ],
  mapTitle: "Meridian Heights",
  mapPois: [
    { x: 96, y: 96, t: "Rajagiriya rail" },
    { x: 420, y: 100, t: "Outer circular exp." },
    { x: 120, y: 214, t: "One Galle Face" },
    { x: 420, y: 222, t: "National Hospital" },
  ],
  progressEyebrow: "Progress",
  progressHeading: "Watch the tower rise.",
  progressSub: "Buyers can follow construction floor by floor — updated by your team.",
  progress: [
    { title: "Site prepared", state: "done" },
    { title: "Foundations", state: "done" },
    { title: "Structure rising", state: "current" },
    { title: "Facade & interiors", state: "next" },
    { title: "Handover", state: "next" },
  ],
  payHeading: "A payment plan that follows the build.",
  paymentSteps: [
    { title: "Reserve", body: "Choose your unit and secure it with a booking deposit." },
    { title: "Agreement", body: "Sign the sale agreement and a clear payment schedule." },
    { title: "Stage payments", body: "Pay in instalments as construction reaches each floor." },
    { title: "Handover", body: "Final walk-through, keys and after-sales support." },
  ],
  enquireEyebrow: "Register your interest",
  enquireHeading: "Come and see the show suite.",
  enquireBody:
    "Leave your details and our sales team will call you to arrange a viewing — or message us on WhatsApp. Buyers overseas are welcome: choose your country code and we'll reach you there.",
  contactPhonePlaceholder: "+94 XX XXX XXXX",
  contactEmail: "hello@meridianheights.lk",
  footerNote:
    "Sample website for a fictional development, designed by LankaNewHomes Web Design. All names, prices, distances and contact details are placeholders. Photography from Unsplash.",
};

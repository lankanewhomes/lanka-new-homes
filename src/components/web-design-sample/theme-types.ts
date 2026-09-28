import type { SamplePlanRoom } from "./plan-drawing";

// The shared shape every sample-site theme fills in. SampleSite and its
// children (SampleHeader, SampleEnquiryForm, LocationMap) read only from
// this — no theme-specific component code lives outside the theme files
// themselves (theme-halcyon export inside sample-data.ts, theme-meridian.ts,
// theme-azure-cove.ts). Adding a 4th sample means adding one more file of
// this shape plus its own route, nothing else.

export type AmenityIconKey = "waves" | "dumbbell" | "trees" | "shield" | "baby" | "plug" | "coffee" | "sun" | "film" | "wifi" | "car" | "sparkles" | "sailboat" | "utensils";

export type SampleResidence = {
  key: string;
  name: string;
  bedrooms: string;
  size: string;
  blurb: string;
  rooms: SamplePlanRoom[];
};

export type SampleMapPoi = { x: number; y: number; t: string };

export type SampleTheme = {
  /** Used as `data-theme` on .smp-root (picks the CSS palette) and in route slugs. */
  id: string;
  /** The two stacked lines of the header/footer logo, e.g. "Halcyon" / "Residences". */
  siteName: string;
  siteNameSub: string;
  /** CSS class string (next/font `.variable`s) applied to a wrapper div so this
   * theme's own font pair shadows the default one set on <html> — see the
   * per-theme file, which loads the actual fonts. */
  fontVariables: string;
  metaTitle: string;
  metaDescription: string;
  /** aria-label on the hero <section> and the header logo link, e.g. "Meridian Heights". */
  heroAriaLabel: string;
  locationLine: string;
  heroHeadline: string;
  heroSub: string;
  images: { hero: string; intro: string };
  nav: readonly { href: string; label: string }[];
  facts: readonly { value: string; label: string }[];
  introEyebrow: string;
  introHeading: string;
  introBody: string;
  introChecks: readonly string[];
  residencesEyebrow: string;
  residencesHeading: string;
  residencesSub: string;
  residences: readonly SampleResidence[];
  galleryHeading: string;
  gallery: readonly { src: string; alt: string; caption: string; wide?: boolean }[];
  amenitiesEyebrow: string;
  amenitiesHeading: string;
  amenities: readonly { icon: AmenityIconKey; title: string; body: string }[];
  locationEyebrow: string;
  locationHeading: string;
  locationBody: string;
  nearby: readonly { name: string; time: string }[];
  mapTitle: string;
  mapPois: readonly SampleMapPoi[];
  progressEyebrow: string;
  progressHeading: string;
  progressSub: string;
  progress: readonly { title: string; state: "done" | "current" | "next" }[];
  payHeading: string;
  paymentSteps: readonly { title: string; body: string }[];
  enquireEyebrow: string;
  enquireHeading: string;
  enquireBody: string;
  contactPhonePlaceholder: string;
  contactEmail: string;
  footerNote: string;
};

import type { AddOnType, FeaturedTier, Placement } from "./config";

/** A paid package owned by a developer (not a project). The developer picks which projects fill the slots. */
export type FeaturedPackage = {
  id: string;
  developerSlug: string;
  tier: FeaturedTier;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  slots: number;
  projectSlugs: string[]; // chosen projects, at most `slots`
  foundingPartner?: boolean;
};

export type AddOnCreative = { image: string; headline: string; ctaLabel?: string; ctaHref: string; subline?: string };

export type AddOnBooking = {
  id: string;
  type: AddOnType;
  developerSlug: string;
  projectSlug?: string;
  startDate: string;
  endDate: string;
  creative?: AddOnCreative;
  /** City-tile bookings: which city tile this booking sponsors. */
  city?: string;
};

export type FeaturedState = {
  packages: FeaturedPackage[];
  bookings: AddOnBooking[];
  demo: boolean;
};

/** What the page tells a slot about itself, so only matching projects are shown. */
export type SlotContext = {
  location?: string; // place name: "Colombo", "Kandy", "Piliyandala"...
  type?: string; // "Apartments", "Villas", "Housing"...
  tags?: string[]; // extra topic words (guides): "luxury", "beachfront"
  projectSlug?: string; // current project page (excluded from its own results)
  developerSlug?: string; // current project's developer (for competitor-free pages)
  city?: string; // homepage city tiles
  query?: string; // autocomplete
  limit?: number;
  now?: Date;
};

export type FeaturedItem = {
  project: import("@/types").Project;
  tier: FeaturedTier;
  packageId: string;
  developerSlug: string;
};

export type { Placement };

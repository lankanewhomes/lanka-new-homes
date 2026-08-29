export type ProjectStatus =
  | "Now Selling"
  | "Coming Soon"
  | "Under Construction"
  | "Launching Soon"
  | "Nearly Sold Out"
  | "Nearly Complete";

export type Amenity = {
  name:
    | "Pool"
    | "Gym"
    | "Rooftop"
    | "Parking"
    | "Security"
    | "CCTV"
    | "Garden"
    | "Children's Area"
    | "Clubhouse"
    | "EV Charging"
    | "Concierge"
    | "Padel Court"
    | "Resident Lounge"
    | "Private Elevator"
    | "Utility Area"
    | "Outdoor Kitchen"
    | "Infinity Pool"
    | "Games Room"
    | "Sky Lounge"
    | "Retail Mall"
    | "Hotel"
    | "Gated Community"
    | "Beachfront"
    | "Sea View";
  icon: string;
};

export type KeyFeatureItem = {
  field: string;
  value: string;
};

export type KeyFeatureCategory = {
  /** Slugified — "indoor"/"outdoor" for the two built-in categories, or a
   * slug generated from the label for an admin-added custom category. */
  key: string;
  label: string;
  items: KeyFeatureItem[];
};

export type FloorPlan = {
  id: string;
  planName: string;
  planType?: string;
  bedrooms: number;
  bathrooms: number;
  floorAreaSqFt: number;
  interiorSizeSqFt?: number;
  balconySizeSqFt?: number;
  basement?: string;
  garage?: string;
  parkingSpaces?: number;
  startingPriceLkr: number;
  image: string;
  availability: "Available" | "Limited" | "Sold Out";
  quickMoveIn?: boolean;
};

export type NearbyPlace = {
  category: "School" | "Hospital" | "Shopping" | "Restaurant" | "Transport" | "Landmark";
  name: string;
  distanceKm: number;
};

export type PricingHistoryEntry = {
  date: string;
  note: string;
};

export type ProjectStatLabel =
  | "Listing status"
  | "Building status"
  | "Price CAD"
  | "Price range"
  | "Address"
  | "Total units"
  | "Total Units"
  | "Floor plans"
  | "Stories"
  | "Floors"
  | "Property type"
  | "Beds"
  | "Baths"
  | "SqFt"
  | "Move in"
  | "Units sold"
  | "Units available"
  | "Road"
  | "Area"
  | "Electricity"
  | "Tap water"
  | "Per SqFt (Avg)"
  | "Incentives"
  | "Parking"
  | "Carpark levels"
  | "Avg unit price"
  | "Avg floor area"
  | "Ownership"
  | "Ceilings"
  | "Neighborhood"
  | "Security"
  | "District"
  | "Sales started";

// SEO overrides shared by Project, Developer, and Neighborhood. These live
// entirely inside each entity's `data` jsonb column — no schema migration
// needed to add them.
export type SeoFields = {
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
};

export type Developer = SeoFields & {
  slug: string;
  name: string;
  logo: string;
  description: string;
  location: string;
  establishedYear: number;
  yearsInBusiness: number;
  activeProjects: number;
  completedProjects: number;
  website: string;
  email: string;
  phone: string;
  coDevelopers?: CoDeveloperEntry[];
  officeHours?: OfficeHoursEntry[];
  socialLinks?: SocialLinks;
  awards?: { title: string; year?: string; issuer?: string }[];
  pressMentions?: { title: string; source: string; url?: string; date?: string }[];
  /** Indexed column `developers.verification_status`. NOT yet mirrored by
   * developerToRow — see supabase/migrations/20260827120500_verification_workflow.sql. */
  verificationStatus?: "pending" | "approved" | "rejected" | "changes_requested";
};

export type CoDeveloperEntry = { name: string; href?: string };

export type SocialLinks = {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  whatsapp?: string;
  youtube?: string;
  tiktok?: string;
};

// Property Facts grid — admin-selectable icon per fact, whitelisted against
// ICON_MAP (src/lib/fact-icons.ts) so only valid lucide-react icons can be
// stored. Lives in Project.factsGrid inside the `data` jsonb column.
export type FactIconKey =
  | "building-2"
  | "wrench"
  | "layout-grid"
  | "footprints"
  | "bed-double"
  | "bath"
  | "ruler"
  | "parking-circle"
  | "file-text"
  | "hard-hat"
  | "dollar-sign"
  | "calendar"
  | "shield"
  | "warehouse"
  | "paw-print";

export type FactItem = {
  key: string;
  label: string;
  value: string;
  icon: FactIconKey;
};

export type OfficeHoursEntry = {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  open: boolean;
  from?: string;
  to?: string;
};

export type Project = SeoFields & {
  slug: string;
  name: string;
  developerSlug: string;
  developerName: string;
  architectName?: string;
  architectSlug?: string;
  marketingCompanyName?: string;
  marketingCompanySlug?: string;
  salesCompanyName?: string;
  salesCompanySlug?: string;
  interiorDesignerName?: string;
  interiorDesignerSlug?: string;
  location: string;
  district: string;
  city: string;
  province: string;
  neighborhood: string;
  neighborhoodSlug?: string;
  road?: string;
  area?: string;
  electricity?: string;
  tapWater?: string;
  type: string;
  status: ProjectStatus;
  isFeatured?: boolean;
  isMoveInNow?: boolean;
  coDevelopers?: CoDeveloperEntry[];
  launchDate: string;
  completionYear: number;
  constructionStatus: string;
  constructionStarted?: string;
  startingPriceLkr: number;
  priceRange: string;
  bedrooms: string;
  bathrooms: string;
  floorAreaRange: string;
  units: number;
  floors: number;
  /** Number of dedicated carpark floors/levels, when distinct from the residential floor count. */
  carparkLevels?: number;
  /** Average sale price across all units, when the source data provides a building-wide average distinct from startingPriceLkr (the lowest advertised price). */
  averageUnitPriceLkr?: number;
  /** Average unit floor area across the building, when the source data provides a building-wide average distinct from floorAreaRange. */
  averageFloorAreaSqFt?: number;
  parking: string;
  security: string;
  ownership: string;
  ceilingInfo?: string;
  paymentPlan: string;
  paymentPlanItems?: string[];
  availablePlanPrices?: string;
  pricingComingSoon?: string;
  averagePricePerSqft?: string;
  monthlyMaintenancePerSqft?: string;
  propertyTax?: string;
  parkingCost?: string;
  storageCost?: string;
  coopFeeRealtors?: string;
  pricingHistory?: PricingHistoryEntry[];
  /** Same shape as pricingHistory — a dated log of availability changes. */
  availabilityHistory?: PricingHistoryEntry[];
  /** Same shape as pricingHistory — a dated log of status changes. */
  statusHistory?: PricingHistoryEntry[];
  /** Same shape as pricingHistory — a dated log of completion-date changes. */
  completionDateHistory?: PricingHistoryEntry[];
  depositPaymentStructure?: string;
  incentives?: string[];
  summary: string;
  description: string;
  heroImage: string;
  gallery: { label: string; image: string }[];
  brochureUrl?: string;
  videos?: { label: string; embedUrl?: string; thumbnail?: string }[];
  virtualTours?: { label: string; url: string }[];
  interactiveMapUrl?: string;
  mobileVisibleStats?: ProjectStatLabel[];
  desktopVisibleStats?: ProjectStatLabel[];
  floorPlanVisibleStats?: string[];
  amenities: Amenity[];
  /** In-unit finishes/features (e.g. Kitchen: "Pantry cabinets") — distinct from
   * building-level Amenity entries. Grouped into categories (Indoor/Outdoor by
   * default, plus any admin-added custom category); each item is a field/value
   * pair, picked from a preset list or freely typed. Rendered as the "Key
   * Features" accordion. Older projects may still hold the legacy
   * `{ indoor?: string[]; outdoor?: string[]; other?: string[] }` shape in
   * Supabase — both the wizard and the public section normalize it on read. */
  unitFeatures?: KeyFeatureCategory[];
  floorPlans: FloorPlan[];
  nearby: NearbyPlace[];
  hotDeal?: {
    enabled: boolean;
    badge: string;
    title: string;
    description: string;
  };
  coordinates: { lat: number; lng: number };
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  /** Indexed column `projects.is_verified`. NOT yet mirrored by
   * projectToRow — see supabase/migrations/20260827120500_verification_workflow.sql. */
  isVerified?: boolean;
  /** Admin-editable Property Facts grid. Falls back to a default set built
   * from other Project fields when empty — see PropertyFactsGrid. */
  factsGrid?: FactItem[];
  /** Utilities bundled into the maintenance/CAM fee — e.g. "Water",
   * "Security". No safe default; the section only shows this card when set. */
  includedUtilities?: string[];
  /** Utilities/costs the buyer pays on top of maintenance. Falls back to
   * the existing propertyTax/parkingCost/storageCost/monthlyMaintenancePerSqft
   * fields when empty — see UtilitiesCostsSection. */
  paidUtilities?: { label: string; value: string }[];
};

// Land parcels — a separate inventory type from Project (new-construction
// developments). Sold by the same seller pool (developers, construction
// companies, or independent builders), but distinct fields: land is
// measured in perches (Sri Lanka's standard unit), not floor area, and has
// no floor plans/amenities/units.
export type LandSellerType = "developer" | "construction_company" | "builder";

export type Land = SeoFields & {
  slug: string;
  title: string;
  sellerType: LandSellerType;
  /** developers.slug or construction_companies.slug when sellerType links to
   * a real profile page; omitted when sellerType is "builder" with no
   * profile on the site (sellerName is the only identifier then). */
  sellerSlug?: string;
  sellerName: string;
  location: string;
  district: string;
  city: string;
  province: string;
  landSizePerches: number;
  landSizeAcres?: number;
  priceLkr: number;
  pricePerPerchLkrMin?: number;
  pricePerPerchLkrMax?: number;
  /** e.g. "Residential", "Commercial", "Agricultural", "Mixed" — free text, no fixed vocabulary yet. */
  landUse: string;
  /** Distinct from `landUse` (intended use) — e.g. "Bare Land", "Land with House", "Paddy Land", "Coconut Land". Free text, no fixed vocabulary yet. */
  landType?: string;
  /** e.g. "Rectangular", "Square", "Irregular", "L-Shaped". */
  landShape?: string;
  roadAccess?: string;
  roadWidthFt?: number;
  electricity?: string;
  water?: string;
  /** e.g. "Freehold - Sinhala Deed", "Freehold - Swarnabhoomi", "Torrens Title". */
  titleType?: string;
  /** e.g. "Approved survey plan", "Survey pending" — separate from `titleType` (ownership classification). */
  surveyPlanStatus?: string;
  /** Free-text payment plan lines, e.g. "40% down payment with 24 months interest-free plan". */
  paymentPlanItems?: string[];
  /** Marketing trust badges (e.g. "Easy Payment Plan", "Fast Legal Services", "Zero Documentation") — shown as small pills in the hero, distinct from `facilities` (physical parcel characteristics). */
  badges?: string[];
  /** Land's Amenities-equivalent — general parcel characteristics (e.g. "Wide Road", "Corner Plot"), not building amenities. Checkbox-selected in the wizard, no fixed vocabulary enforced at the type level. */
  facilities?: string[];
  /** Building-style amenities (Pool, Gym, Security, CCTV, Garden, etc.) — for land developments/gated communities that offer shared facilities. Reuses the same `Amenity` vocabulary as `Project.amenities` and the same `AmenitiesShowcaseSection` component. */
  amenities?: Amenity[];
  /** In-unit finishes/features, same shape and editor as `Project.unitFeatures` — applies when the land is sold with a planned/model home rather than as a bare parcel. */
  unitFeatures?: KeyFeatureCategory[];
  /** Individual plots/lots within this land development — the "Floor Plans" equivalent for a subdivided parcel. Omit when the listing is a single, unsubdivided parcel. */
  plots?: LandPlot[];
  status: "Available" | "Reserved" | "Sold";
  isFeatured?: boolean;
  summary: string;
  description: string;
  heroImage: string;
  gallery: { label: string; image: string }[];
  /** Site/subdivision layout diagrams — a separate slot from the general gallery so more than one can be entered without relying on label-text matching. */
  blockPlanImages?: { label: string; image: string }[];
  roadMapImages?: { label: string; image: string }[];
  videos?: { label: string; url: string }[];
  nearby: NearbyPlace[];
  coordinates: { lat: number; lng: number };
  contact: {
    name: string;
    email: string;
    phone: string;
  };
};

export type LandPlot = {
  id: string;
  name: string;
  sizePerches: number;
  priceLkr: number;
  status: "Available" | "Reserved" | "Sold";
  image?: string;
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferredContactMethod: "Email" | "Phone" | "WhatsApp" | "Text";
  message: string;
  projectSlug: string;
  developerSlug: string;
  date: string;
  status: "New" | "Contacted" | "Qualified" | "Closed";
  assignedTo?: string;
  assignedAt?: string;
};

export type LeadActivity = {
  id: number;
  leadId: string;
  note: string;
  createdBy?: string;
  createdAt: string;
};

export type SavedSearch = {
  id: number;
  userId: string;
  name: string;
  filters: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DeveloperMember = {
  id: number;
  developerSlug: string;
  userId: string;
  role: "owner" | "sales" | "marketing" | "member";
  createdAt: string;
};

export type AuditLog = {
  id: number;
  adminId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  createdAt: string;
};

export type DeveloperSubscription = {
  id: number;
  developerSlug: string;
  plan: "free" | "professional" | "premium" | "enterprise";
  status?: string;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
};

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: "Buying Guide" | "Market Insight" | "Finance";
  readTime: string;
  image: string;
};

export type Location = {
  slug: string;
  name: string;
  district: string;
  province: string;
  projectCount: number;
  image: string;
  summary: string;
};

export type Neighborhood = SeoFields & {
  slug: string;
  name: string;
  city: string;
  province: string;
  description: string;
  heroImage: string;
};

export type ConstructionCompanyCategory = "general" | "colombo" | "swimming-pools" | "consulting";

export type ConstructionCompany = {
  slug: string;
  name: string;
  logo: string;
  description: string;
  location: string;
  categories: ConstructionCompanyCategory[];
  yearsInBusiness?: number;
  website?: string;
  email?: string;
  phone?: string;
  socialLinks?: SocialLinks;
};

// Shared shape for the lightweight partner directories linked from a
// project/land's "Connected Pages" — marketing companies, sales companies,
// architects, interior designers. Distinct from Developer (who owns
// projects) and ConstructionCompany (which has its own category directory).
export type CompanyProfile = {
  slug: string;
  name: string;
  logo: string;
  description: string;
  location: string;
  yearsInBusiness?: number;
  website?: string;
  email?: string;
  phone?: string;
  officeHours?: OfficeHoursEntry[];
  socialLinks?: SocialLinks;
};

export type MarketingCompany = CompanyProfile;
export type SalesCompany = CompanyProfile;
export type Architect = CompanyProfile;
export type InteriorDesigner = CompanyProfile;

export type HeroAdStatus = "pending" | "approved" | "rejected" | "archived";

export type HeroAd = {
  id: string;
  developerSlug: string;
  developerName: string;
  projectSlug?: string;
  image: string;
  headline: string;
  linkUrl: string;
  startDate: string;
  endDate: string;
  status: HeroAdStatus;
  order: number;
  priceLkr: number | null;
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
};

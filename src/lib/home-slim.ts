import type { Project } from "@/types";

// The homepage only draws listing cards, search suggestions and counts, but
// it receives every project and land as props — which Next serialises into
// the page HTML. Full records (floor plans, galleries, descriptions,
// translations…) made the homepage ~5.6 MB. Keep only what the cards read:
// name, location, price, status, hero image and a short photo carousel.
const CARD_PHOTOS = 6;

// Fields only the detail pages, the CMS or emails read. Listing cards, filters, the map and the home sections never touch them, so they
// are dropped before the record is serialised into the page HTML (the homepage and listing pages were 1.4-2.6 MB).
const DETAIL_ONLY = new Set([
  "referenceLinks", "videos", "virtualTours", "verification", "socialLinks", "roadMapImages", "blockPlanImages", "contact", "brochureUrl",
  "streetViewUrl", "view360Url", "interactiveMapUrl", "installmentSchedule", "social", "additional_builders", "additional_developers",
  "additionalBuilderSlugs", "additionalDeveloperSlugs", "architect", "contractor", "seoTitle", "seoDescription", "ogImage", "canonicalUrl",
  "updatedAt", "statusHistory", "completionDateHistory", "availabilityHistory", "pricingHistory", "constructionUpdates", "legalFees", "utilityFees",
  "otherFees", "financingOptions", "incentives", "pricingAddOns", "pricingNotes", "reservationFee", "reservationDeposit", "downPayment",
  "depositPaymentStructure", "coopFeeRealtors", "parkingCost", "storageCost", "propertyTax", "rentalIncome", "includedUtilities", "paidUtilities",
  "mobileVisibleStats", "desktopVisibleStats", "floorPlanVisibleStats", "commercialAreas", "interior_designer", "landscapeArchitect",
  "structuralEngineer", "mepConsultant", "quantitySurveyor", "projectManagementCompany", "superstructureContractor", "finishingContractor",
]);
const dropDetailOnly = <T extends object>(record: T): T =>
  Object.fromEntries(Object.entries(record).filter(([key]) => !DETAIL_ONLY.has(key) && !key.startsWith("verification_"))) as T;

export function slimForHome(project: Project): Project {
  return dropDetailOnly({
    ...project,
    summary: "",
    description: "",
    highlights: undefined,
    translations: undefined,
    ownershipServices: undefined,
    paymentPlanItems: undefined,
    constructionUpdates: undefined,
    unitFeatures: undefined,
    amenities: [],
    nearby: [],
    // Bedroom search reads each plan's bedroom count — keep just that.
    // One entry per distinct bedroom count is enough for the filter (a 244-plot land would otherwise repeat the same value 244 times).
    floorPlans: [...new Set((project.floorPlans ?? []).map((plan) => plan.bedrooms))].map((bedrooms) => ({ bedrooms }) as Project["floorPlans"][number]),
    gallery: project.gallery.slice(0, 12).filter((item) => !/\/(amenities|floor-plans|road-map|block-plan)\//.test(item.image)).slice(0, CARD_PHOTOS).map((item) => ({ label: "", image: item.image })),
    // Some rows still carry a large embedded `developer` blob the cards never read.
    ...({ developer: undefined } as object),
  });
}

export function countFloorPlans(projects: Project[]) {
  return projects.reduce((total, project) => total + (project.floorPlans?.length ?? 0), 0);
}

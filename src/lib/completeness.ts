// Listing completeness — one list of checks used in three places:
//   • the Projects beforeChange hook that stores `completeness_score`
//     (src/collections/hooks/project-scoring.ts),
//   • the to-do panel on the project edit form (CompletenessTodo.tsx),
//   • the developer dashboard's "Finish your listings" panel
//     (ListingTodoPanel.tsx via the /listing-todo endpoint).
// Pure and Payload-free so the client components can import it. Every
// check is a "did the developer fill this in" question — nothing here
// estimates or derives a value for them.

export type CompletenessPlan = {
  startingPriceLkr?: unknown
  floorAreaSqFt?: unknown
  image?: unknown
  view?: unknown
  handoverCondition?: unknown
  unitsAvailable?: unknown
}

export type CompletenessData = {
  name?: unknown
  developer?: unknown
  location?: unknown
  status?: unknown
  type?: unknown
  startingPriceLkr?: unknown
  bedrooms?: unknown
  bathrooms?: unknown
  floorAreaRange?: unknown
  units?: unknown
  floors?: unknown
  description?: unknown
  heroImage?: unknown
  gallery?: unknown
  amenities?: unknown
  floorPlans?: unknown
  coordinates?: { lat?: unknown; lng?: unknown }
  contact?: { name?: unknown; email?: unknown; phone?: unknown }
  completionYear?: unknown
  availableUnits?: unknown
  brochureUrl?: unknown
  nearby?: unknown
  paymentPlan?: unknown
}

export type CompletenessCheck = {
  key: string
  /** Imperative — what to do: "Add per-plan prices". */
  label: string
  /** Where/why, one line. */
  hint: string
  check: (data: CompletenessData) => boolean
}

const filled = (value: unknown) => (typeof value === 'string' ? value.trim() !== '' && value.trim() !== '-' : value !== null && value !== undefined && value !== false)
const positive = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value > 0
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
const plans = (data: CompletenessData): CompletenessPlan[] => list(data.floorPlans) as CompletenessPlan[]
const everyPlan = (data: CompletenessData, test: (plan: CompletenessPlan) => boolean) => {
  const all = plans(data)
  return all.length > 0 && all.every(test)
}

// Order = the order shown on the to-do list. Weighted equally: the score is
// simply the share of checks that pass, so every item is worth the same.
export const COMPLETENESS_CHECKS: CompletenessCheck[] = [
  { key: 'name', label: 'Add the project name', hint: 'Project Information', check: (d) => filled(d.name) },
  { key: 'developer', label: 'Link the developer', hint: 'Project Information → Developer', check: (d) => filled(d.developer) },
  { key: 'location', label: 'Add the address', hint: 'Location → Location / address line', check: (d) => filled(d.location) },
  { key: 'status', label: 'Set the listing status', hint: 'Status & Badges → Status', check: (d) => filled(d.status) },
  { key: 'type', label: 'Set the property type', hint: 'Project Information → Type', check: (d) => filled(d.type) },
  { key: 'startingPriceLkr', label: 'Add the starting price', hint: 'Pricing → Starting price (LKR)', check: (d) => positive(d.startingPriceLkr) },
  { key: 'bedrooms', label: 'Add bedrooms', hint: 'Apartment Details → Bedrooms', check: (d) => filled(d.bedrooms) },
  { key: 'bathrooms', label: 'Add bathrooms', hint: 'Apartment Details → Bathrooms', check: (d) => filled(d.bathrooms) },
  { key: 'floorAreaRange', label: 'Add the floor area range', hint: 'Apartment Details → Floor area range', check: (d) => filled(d.floorAreaRange) },
  { key: 'units', label: 'Add total units', hint: 'Apartment Details → Units', check: (d) => positive(d.units) },
  { key: 'floors', label: 'Add the number of floors', hint: 'Apartment Details → Floors', check: (d) => positive(d.floors) },
  { key: 'description', label: 'Write the description', hint: 'Project Information → Description', check: (d) => filled(d.description) },
  { key: 'heroImage', label: 'Add a hero image', hint: 'Gallery → Hero image', check: (d) => filled(d.heroImage) },
  { key: 'gallery', label: 'Add gallery photos', hint: 'Gallery', check: (d) => list(d.gallery).length > 0 },
  { key: 'amenities', label: 'Tick the amenities', hint: 'Amenities', check: (d) => list(d.amenities).length > 0 },
  { key: 'floorPlans', label: 'Add at least one floor plan', hint: 'Floor Plans', check: (d) => plans(d).length > 0 },
  { key: 'coordinates', label: 'Pin the map location', hint: 'Location → Coordinates', check: (d) => typeof d.coordinates?.lat === 'number' && typeof d.coordinates?.lng === 'number' },
  { key: 'contact', label: 'Add sales contact name, email and phone', hint: 'Contact', check: (d) => Boolean(filled(d.contact?.name) && filled(d.contact?.email) && filled(d.contact?.phone)) },
  // Added 2026-09-08 with the developer to-do list — the fields buyers
  // filter and compare on, and the new per-plan fields.
  { key: 'completionYear', label: 'Add the move-in year', hint: 'Status & Badges → Move-In Year (drives the "Move in 2030" badge and the Move-in filter)', check: (d) => positive(d.completionYear) },
  { key: 'availableUnits', label: 'Add units available', hint: 'Apartment Details → Units available', check: (d) => positive(d.availableUnits) },
  { key: 'brochureUrl', label: 'Add the brochure PDF', hint: 'Gallery → Brochure URL (buyers can download it and it is emailed on request)', check: (d) => filled(d.brochureUrl) },
  { key: 'nearby', label: 'Add nearby places', hint: 'Neighborhood → Nearby places (schools, hospitals, transport with distances)', check: (d) => list(d.nearby).length > 0 },
  { key: 'paymentPlan', label: 'Describe the payment plan', hint: 'Pricing → Payment plan', check: (d) => filled(d.paymentPlan) },
  { key: 'plansPriced', label: 'Add per-plan prices', hint: 'Floor Plans → Starting price on every plan (shows "From Rs. …" on each plan card)', check: (d) => everyPlan(d, (p) => positive(p.startingPriceLkr)) },
  { key: 'plansSized', label: 'Add per-plan floor areas', hint: 'Floor Plans → Floor area (SqFt) on every plan', check: (d) => everyPlan(d, (p) => positive(p.floorAreaSqFt)) },
  { key: 'plansImaged', label: 'Add a plan image to every floor plan', hint: 'Floor Plans → Image', check: (d) => everyPlan(d, (p) => filled(p.image)) },
  { key: 'plansDetailed', label: 'Add view and handover condition to every plan', hint: 'Floor Plans → View, Handover condition (the new plan chips and fact sheet)', check: (d) => everyPlan(d, (p) => filled(p.view) && filled(p.handoverCondition)) },
  { key: 'plansAvailability', label: 'Add units available per plan', hint: 'Floor Plans → Units available', check: (d) => everyPlan(d, (p) => positive(p.unitsAvailable)) },
]

// final_score = completeness_score * COMPLETENESS_WEIGHT + engagement +
// recency + paid boost (project-scoring.ts) — so each finished item is
// worth this many ranking points.
export const COMPLETENESS_WEIGHT = 0.3
export const RANKING_POINTS_PER_ITEM = Math.round((100 / COMPLETENESS_CHECKS.length) * COMPLETENESS_WEIGHT * 10) / 10
export const SCORE_POINTS_PER_ITEM = Math.round((100 / COMPLETENESS_CHECKS.length) * 10) / 10

export type CompletenessItem = { key: string; label: string; hint: string; done: boolean }

export function computeCompleteness(data: CompletenessData): { score: number; items: CompletenessItem[]; missing: CompletenessItem[] } {
  const items = COMPLETENESS_CHECKS.map(({ key, label, hint, check }) => ({ key, label, hint, done: check(data) }))
  const doneCount = items.filter((item) => item.done).length
  const score = Math.round((doneCount / COMPLETENESS_CHECKS.length) * 100)
  return { score, items, missing: items.filter((item) => !item.done) }
}

export function computeCompletenessScore(data: CompletenessData): number {
  return computeCompleteness(data).score
}

import type { CollectionAfterChangeHook } from 'payload'
import { getPackage, type PackageTier } from '@/lib/packages'

function relatedId(value: unknown): string | number | undefined {
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: string | number }).id
  return value as string | number | undefined
}

function idsOf(value: unknown): (string | number)[] {
  if (!Array.isArray(value)) return []
  return value.map((v) => relatedId(v)).filter((v): v is string | number => v != null)
}

// Billing moved from per-project to per-developer (owner, 2026-09-24): a
// developer buys ONE plan, which includes a number of featured slots (plus
// any extra slots purchased — see packages.ts's extraFeaturedSlotPrice),
// and picks which of their OWN projects use those slots
// (Developers.featuredProjectIds). This hook is what makes that real: it
// keeps every one of the developer's projects' existing `package` field in
// sync, so every consumer that already reads Projects.package —
// project-scoring.ts's rankingBoost, the Featured/Premium badges,
// ListingAnalyticsPanel's leadAnalytics gating, the weekly digest's
// weeklyReports gating — keeps working completely unchanged. A project
// left out of featuredProjectIds always reads as Free, even while its
// developer has an active paid plan — that's the whole point of the slot
// picker (owner: "they can choose which project").
//
// Runs on every Developers save (not just when plan/featuredUntil/
// featuredProjectIds specifically changed) — simplest correct approach;
// the no-op check below skips a project whose package already matches, so
// a routine profile edit (e.g. updating office hours) costs one extra find
// query but no needless writes.
//
// Developer Pro/Campaign are supposed to grant one homepage hero carousel
// slide (see placement-inventory memory). A developer can have several
// featured projects at once, but the slide can only show one — the FIRST
// entry in featuredProjectIds represents them (the order a developer's own
// toggles were switched on, oldest first; there's no separate "pick your
// hero project" control, so this is a judgment call, not a spec'd rule —
// revisit if the owner wants explicit control over which one). Never
// invents an image — skips creating a slide entirely if that project has
// no heroImage yet. Archives the slide (doesn't delete it) once the
// developer drops below Developer Pro/Campaign or has no featured projects
// left, so admin history isn't lost.
async function syncHeroSlideFromDeveloper(
  req: Parameters<CollectionAfterChangeHook>[0]['req'],
  developerId: string | number,
  wantsHeroSlide: boolean,
  representativeProjectId: string | number | undefined,
  featuredUntil: unknown,
) {
  const existing = await req.payload.find({
    collection: 'hero-slides',
    where: { advertiser: { equals: developerId }, auto_generated: { equals: true } },
    limit: 1,
    overrideAccess: true,
    req,
  })
  const existingSlide = existing.docs[0]

  if (!wantsHeroSlide || !representativeProjectId) {
    if (existingSlide && existingSlide.status !== 'archived') {
      await req.payload.update({ collection: 'hero-slides', id: existingSlide.id, data: { status: 'archived' }, overrideAccess: true, req })
    }
    return
  }

  const project = await req.payload.findByID({ collection: 'projects', id: representativeProjectId, overrideAccess: true, req })
  if (!project?.heroImage) return

  const data = {
    headline: project.name,
    image: project.heroImage,
    project: Number(representativeProjectId),
    advertiser: Number(developerId),
    page_target: 'homepage',
    display_order: 0,
    status: 'active' as const,
    is_paid_placement: true,
    auto_generated: true,
    start_date: new Date().toISOString(),
    end_date: featuredUntil ? new Date(featuredUntil as string).toISOString() : undefined,
  }

  if (existingSlide) {
    await req.payload.update({ collection: 'hero-slides', id: existingSlide.id, data, overrideAccess: true, req })
  } else {
    await req.payload.create({ collection: 'hero-slides', data, overrideAccess: true, req })
  }
}

// A Developer's raw `plan` field isn't reset to 'free' the moment
// `featuredUntil` passes — nothing writes to the developer doc itself when
// a plan simply expires with time (only an explicit Subscription change
// does). So anything that cares whether a plan is CURRENTLY live must
// compute it from both fields, not trust `plan` alone. Shared by
// syncFeaturedProjectsFromDeveloper below and syncDeveloperToSupabase
// (the developerSpotlight homepage chip — see sync-to-supabase.ts) so both
// agree on the exact same "is this plan still active" rule.
export function effectivePlanTier(plan: unknown, featuredUntil: unknown): PackageTier {
  const rawPlan = typeof plan === 'string' ? plan : 'free'
  const until = featuredUntil ? new Date(featuredUntil as string) : null
  const isActive = rawPlan !== 'free' && (!until || until.getTime() > Date.now())
  return isActive ? getPackage(rawPlan).tier : 'free'
}

export const syncFeaturedProjectsFromDeveloper: CollectionAfterChangeHook = async ({ doc, req }) => {
  const developerId = doc.id
  const effectiveTier = effectivePlanTier(doc.plan, doc.featuredUntil)
  const pkg = getPackage(effectiveTier)
  const featuredIdList = idsOf(doc.featuredProjectIds)
  const featuredIds = new Set(featuredIdList.map(String))
  // Land packages (owner, 2026-09-25: "same plan/slot system, but for land
  // listings") — SHARES the developer's plan/slot pool above, not a
  // separate one. Only land where this developer is the seller
  // (sellerType 'developer') can ever be in this list — see the scope note
  // on Lands.package for why construction-company/builder-sold land isn't
  // covered.
  const featuredLandIdList = idsOf(doc.featuredLandIds)
  const featuredLandIds = new Set(featuredLandIdList.map(String))

  const { docs: projects } = await req.payload.find({
    collection: 'projects',
    where: { developer: { equals: developerId } },
    depth: 0,
    limit: 500,
    overrideAccess: true,
    req,
  })

  await Promise.all(
    projects.map((project) => {
      const isFeaturedHere = effectiveTier !== 'free' && featuredIds.has(String(project.id))
      const targetPackage = isFeaturedHere ? effectiveTier : 'free'
      if (project.package === targetPackage) return null
      return req.payload.update({
        collection: 'projects',
        id: project.id,
        data: { package: targetPackage, featured: isFeaturedHere ? pkg.featured : false },
        overrideAccess: true,
        req,
      })
    }),
  )

  const { docs: lands } = await req.payload.find({
    collection: 'lands',
    where: { seller: { equals: developerId }, sellerType: { equals: 'developer' } },
    depth: 0,
    limit: 500,
    overrideAccess: true,
    req,
  })

  await Promise.all(
    lands.map((land) => {
      const isFeaturedHere = effectiveTier !== 'free' && featuredLandIds.has(String(land.id))
      const targetPackage = isFeaturedHere ? effectiveTier : 'free'
      if (land.package === targetPackage && land.isFeatured === isFeaturedHere) return null
      return req.payload.update({
        collection: 'lands',
        id: land.id,
        data: { package: targetPackage, isFeatured: isFeaturedHere },
        overrideAccess: true,
        req,
      })
    }),
  )

  await syncHeroSlideFromDeveloper(req, developerId, pkg.premiumHeroSlide, featuredIdList[0], doc.featuredUntil)

  return doc
}

// Mirrors a Developer's Subscription (the billing record — see
// Subscriptions.ts) onto that Developer's plan/featuredUntil, then
// delegates to the function above. Only 'active' counts as the plan being
// live; past_due/canceled/incomplete/unpaid (or a later Subscription
// overriding an older one) all revert the developer to Free, which in
// turn reverts every one of their projects to Free too.
export const syncDeveloperPlanFromSubscription: CollectionAfterChangeHook = async ({ doc, req }) => {
  const developerId = relatedId(doc.developer)
  if (!developerId) return doc

  // getPackage(...).tier narrows to a real PackageTier (defaults unknown/
  // missing values to "free") instead of trusting doc.package as a raw string.
  const effectiveTier = doc.status === 'active' ? getPackage(doc.package as string).tier : 'free'
  const developer = await req.payload.update({
    collection: 'developers',
    id: developerId,
    data: {
      plan: effectiveTier,
      featuredUntil: doc.status === 'active' ? doc.current_period_end ?? null : null,
      extra_featured_slots: doc.status === 'active' ? (doc.extra_featured_slots ?? 0) : 0,
    },
    overrideAccess: true,
    req,
    depth: 0,
  })

  await syncFeaturedProjectsFromDeveloper({ doc: developer, req } as Parameters<CollectionAfterChangeHook>[0])

  return doc
}

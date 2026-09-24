import type { CollectionAfterChangeHook } from 'payload'
import { getPackage } from '@/lib/packages'

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
// NOT handled here yet: the "one hero carousel slide" a Developer Pro/
// Campaign plan is supposed to grant (see placement-inventory memory) —
// which of a developer's several featured projects should represent them
// in that one slide isn't specified yet, so hero-slide auto-creation is
// intentionally left alone rather than guessing. The old per-project
// version of this (sync-subscription-package.ts) is retired along with
// per-project billing; re-introduce a developer-level equivalent once
// that's decided.
export const syncFeaturedProjectsFromDeveloper: CollectionAfterChangeHook = async ({ doc, req }) => {
  const developerId = doc.id
  const rawPlan = typeof doc.plan === 'string' ? doc.plan : 'free'
  const featuredUntil = doc.featuredUntil ? new Date(doc.featuredUntil as string) : null
  const isActive = rawPlan !== 'free' && (!featuredUntil || featuredUntil.getTime() > Date.now())
  const effectiveTier = isActive ? rawPlan : 'free'
  const pkg = getPackage(effectiveTier)
  const featuredIds = new Set(idsOf(doc.featuredProjectIds).map(String))

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

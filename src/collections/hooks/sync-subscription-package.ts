import type { CollectionAfterChangeHook } from 'payload'
import { getPackage } from '@/lib/packages'

function relatedId(value: unknown): string | number | undefined {
  if (value && typeof value === 'object' && 'id' in value) {
    return (value as { id: string | number }).id
  }
  return value as string | number | undefined
}

// Developer Pro / Campaign's own pricing copy (packages.ts,
// `premiumHeroSlide`) promises "Priority"/"Premium" homepage exposure —
// this is what makes that real: an active subscription on one of those
// tiers auto-creates (and keeps renewed) one row in the existing Hero
// Slides collection, the same admin-facing place a manually-bought hero
// placement lives (CMS -> Content -> Hero Slides). Marked auto_generated so
// it's distinguishable from a hand-created slide and safe to archive
// automatically once the subscription ends. Never invents an image — skips
// creating a slide entirely if the project has no heroImage yet.
async function syncPremiumHeroSlide(
  req: Parameters<CollectionAfterChangeHook>[0]['req'],
  projectId: string | number,
  wantsHeroSlide: boolean,
  periodEnd: unknown,
) {
  const existing = await req.payload.find({
    collection: 'hero-slides',
    where: { project: { equals: projectId }, auto_generated: { equals: true } },
    limit: 1,
    overrideAccess: true,
    req,
  })
  const existingSlide = existing.docs[0]

  if (!wantsHeroSlide) {
    if (existingSlide && existingSlide.status !== 'archived') {
      await req.payload.update({
        collection: 'hero-slides',
        id: existingSlide.id,
        data: { status: 'archived' },
        overrideAccess: true,
        req,
      })
    }
    return
  }

  if (!periodEnd) return

  const project = await req.payload.findByID({ collection: 'projects', id: projectId, overrideAccess: true, req })
  if (!project?.heroImage) return

  const developerId = relatedId(project.developer)

  const data = {
    headline: project.name,
    image: project.heroImage,
    project: Number(projectId),
    ...(developerId != null ? { advertiser: Number(developerId) } : {}),
    page_target: 'homepage',
    display_order: 0,
    status: 'active' as const,
    is_paid_placement: true,
    auto_generated: true,
    start_date: new Date().toISOString(),
    end_date: new Date(periodEnd as string).toISOString(),
  }

  if (existingSlide) {
    await req.payload.update({ collection: 'hero-slides', id: existingSlide.id, data, overrideAccess: true, req })
  } else {
    await req.payload.create({ collection: 'hero-slides', data, overrideAccess: true, req })
  }
}

// Keeps Projects.package/featured in sync with a Subscription's status —
// same "one collection's change activates a field on Projects" shape as
// hooks/activate-placement.ts (Payments -> Projects.featured/placements).
// Only 'active' counts as the paid tier being live; past_due/canceled/
// incomplete/unpaid (or a subsequent Subscription row overriding an older
// one) all revert the project to Free. Never touches anything else on the
// project — content, media, and relationships are untouched.
export const syncProjectPackageFromSubscription: CollectionAfterChangeHook = async ({ doc, req }) => {
  const projectId = relatedId(doc.project)
  if (!projectId) return doc

  const effectiveTier = doc.status === 'active' ? (doc.package as string) : 'free'
  const pkg = getPackage(effectiveTier)

  await req.payload.update({
    collection: 'projects',
    id: projectId,
    data: { package: pkg.tier, featured: pkg.featured },
    overrideAccess: true,
    req,
  })

  await syncPremiumHeroSlide(req, projectId, pkg.premiumHeroSlide, doc.current_period_end)

  return doc
}

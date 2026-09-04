import type { CollectionAfterChangeHook } from 'payload'

function relatedId(value: unknown): string | number | undefined {
  if (value && typeof value === 'object' && 'id' in value) {
    return (value as { id: string | number }).id
  }
  return value as string | number | undefined
}

// When an admin confirms a featured-listing payment (status -> completed),
// the linked project's placement activates automatically: a new entry is
// appended to its `placements` array (a project can hold several at once —
// e.g. sitewide AND colombo, each its own paid window) and `featured` is
// set true. No separate manual step needed.
//
// Same idea for a hero_slide/hero_image payment: confirming it activates
// the linked HeroSlides doc directly (status -> active) instead of leaving
// the admin to flip that separately after payment.
export const activatePlacementOnPayment: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const justCompleted = doc.status === 'completed' && previousDoc?.status !== 'completed'
  if (!justCompleted) return doc

  const projectId = relatedId(doc.related_project)
  const isPlacementType = doc.payment_type === 'featured_listing' || doc.payment_type === 'featured_search'
  if (isPlacementType && projectId && doc.featured_page) {
    const project = await req.payload.findByID({ collection: 'projects', id: projectId, depth: 0, overrideAccess: true, req })
    if (project) {
      const existingPlacements = Array.isArray(project.placements) ? project.placements : []
      await req.payload.update({
        collection: 'projects',
        id: projectId,
        data: {
          featured: true,
          placements: [
            ...existingPlacements,
            {
              page: doc.featured_page,
              start_date: doc.payment_date ?? new Date().toISOString(),
              end_date: doc.expiry_date ?? undefined,
              source_payment: doc.id,
            },
          ],
        },
        overrideAccess: true,
        req,
      })
    }
  }

  const isHeroSlideType = doc.payment_type === 'hero_slide' || doc.payment_type === 'hero_image'
  const heroSlideId = relatedId(doc.related_hero_slide)
  if (isHeroSlideType && heroSlideId) {
    await req.payload.update({
      collection: 'hero-slides',
      id: heroSlideId,
      data: { status: 'active', payment: doc.id },
      overrideAccess: true,
      req,
    })
  }

  return doc
}

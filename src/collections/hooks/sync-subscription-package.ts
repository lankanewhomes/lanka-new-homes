import type { CollectionAfterChangeHook } from 'payload'
import { getPackage } from '@/lib/packages'

function relatedId(value: unknown): string | number | undefined {
  if (value && typeof value === 'object' && 'id' in value) {
    return (value as { id: string | number }).id
  }
  return value as string | number | undefined
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

  return doc
}

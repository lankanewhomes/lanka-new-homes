/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs are loosely typed here */
import type { CollectionAfterChangeHook, Payload } from 'payload'

// Writes the rows behind the developer timeline. Best effort: a logging problem never blocks a save.
export async function logDeveloperActivity(
  payload: Payload,
  developerId: number | string,
  row: { kind: string; title: string; detail?: string; actor?: string; projectId?: number; landId?: number; developerName?: string },
  req?: unknown,
): Promise<void> {
  try {
    await payload.create({ collection: 'developer-activity' as never, overrideAccess: true, data: { developer: developerId, entityType: 'developers', entityId: Number(developerId), at: new Date().toISOString(), ...row } as never, ...(req ? { req: req as never } : {}) })
  } catch (error) {
    payload.logger.error(`Developer activity log failed: ${error instanceof Error ? error.message : error}`)
  }
}

const actorOf = (req: any): string => (req?.user ? `${req.user.email ?? 'a user'}${req.user.role ? ` (${req.user.role})` : ''}` : 'system')
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
const show = (v: unknown) => (v === null || v === undefined || v === '' ? 'empty' : typeof v === 'object' ? 'updated' : String(v).slice(0, 60))

type Tracked = Record<string, string> // field -> label (a trailing "#" in the label = show only that it changed, not the values)

const DEVELOPER_FIELDS: Tracked = {
  name: 'Name', website: 'Website', contact_email: 'Email', contact_phone: 'Phone', location: 'Location', description: 'Description#', logo: 'Logo#',
  plan: 'Plan', featuredUntil: 'Featured until', verification_status: 'Review status', domain_verified: 'Verified Developer', hide_from_site: 'Hidden from site',
  awards: 'Awards#', socialLinks: 'Social links#', social_links: 'Social links#', lead_alerts: 'Lead alerts#', extra_email_domains: 'Extra email domains#',
}
const PROJECT_FIELDS: Tracked = {
  name: 'Name', status: 'Status', constructionStatus: 'Construction status', startingPriceLkr: 'Starting price', priceRange: 'Price range', units: 'Units', description: 'Description#', summary: 'Summary#',
  floorPlans: 'Floor plans#', gallery: 'Gallery#', amenities: 'Amenities#', unitFeatures: 'Key features#', nearby: 'Nearby#', contact: 'Contact#', socialLinks: 'Social links#', brochureUrl: 'Brochure#', heroImage: 'Hero image#', paymentPlanItems: 'Payment plan#', parking: 'Parking', completionYear: 'Completion year',
}
const LAND_FIELDS: Tracked = {
  title: 'Title', status: 'Status', pricePerPerchLkrMin: 'Price per perch', priceLkr: 'Price', landSizePerches: 'Size', description: 'Description#', summary: 'Summary#', plots: 'Plots#', gallery: 'Gallery#', contact: 'Contact#', heroImage: 'Hero image#',
}

function diff(prev: any, next: any, tracked: Tracked): string[] {
  const out: string[] = []
  for (const [key, raw] of Object.entries(tracked)) {
    if (next?.[key] === undefined || same(prev?.[key], next?.[key])) continue
    const quiet = raw.endsWith('#')
    const label = raw.replace(/#$/, '')
    out.push(quiet ? label : `${label} (${show(prev?.[key])} → ${show(next?.[key])})`)
  }
  return out
}

export const logDeveloperChanges: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== 'update' || !previousDoc) return doc
  const changes = diff(previousDoc, doc, DEVELOPER_FIELDS)
  if (!changes.length) return doc
  const verified = !previousDoc.domain_verified && doc.domain_verified
  const unverified = previousDoc.domain_verified && !doc.domain_verified
  await logDeveloperActivity(req.payload, doc.id, {
    kind: verified || unverified ? 'verification' : 'profile',
    title: verified ? 'Verified Developer switched on' : unverified ? 'Verified Developer removed' : 'Profile updated',
    detail: changes.join(', ').slice(0, 480), actor: actorOf(req), developerName: doc.name,
  }, req)
  return doc
}

export const logProjectChanges: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  const devId = typeof doc?.developer === 'object' ? doc.developer?.id : doc?.developer
  if (!devId) return doc
  if (operation === 'create') {
    await logDeveloperActivity(req.payload, devId, { kind: 'listing', title: `Listing created: ${doc.name}`, detail: doc.isPublished ? 'Published' : 'Draft', actor: actorOf(req), projectId: doc.id }, req)
    return doc
  }
  if (!previousDoc) return doc
  const published = !previousDoc.isPublished && doc.isPublished
  const unpublished = previousDoc.isPublished && !doc.isPublished
  const changes = diff(previousDoc, doc, PROJECT_FIELDS)
  if (!published && !unpublished && !changes.length) return doc
  await logDeveloperActivity(req.payload, devId, {
    kind: 'listing', title: published ? `Listing published: ${doc.name}` : unpublished ? `Listing unpublished: ${doc.name}` : `Listing edited: ${doc.name}`,
    detail: changes.join(', ').slice(0, 480) || undefined, actor: actorOf(req), projectId: doc.id,
  }, req)
  return doc
}

export const logLandChanges: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  const seller = doc?.seller
  const devId = seller && typeof seller === 'object' && seller.relationTo === 'developers' ? (typeof seller.value === 'object' ? seller.value?.id : seller.value) : null
  if (!devId) return doc
  if (operation === 'create') {
    await logDeveloperActivity(req.payload, devId, { kind: 'listing', title: `Land created: ${doc.title}`, actor: actorOf(req), landId: doc.id }, req)
    return doc
  }
  if (!previousDoc) return doc
  const changes = diff(previousDoc, doc, LAND_FIELDS)
  if (!changes.length) return doc
  await logDeveloperActivity(req.payload, devId, { kind: 'listing', title: `Land edited: ${doc.title}`, detail: changes.join(', ').slice(0, 480), actor: actorOf(req), landId: doc.id }, req)
  return doc
}

const COMPANY_FIELDS: Tracked = {
  name: 'Name', contact_email: 'Email', contact_phone: 'Phone', description: 'Description#', logo: 'Logo#', website: 'Website', services: 'Services#', portfolio_link: 'Portfolio link', isDesignBuild: 'Design & Build', socialLinks: 'Social links#', location: 'Location',
}

// Activity of the other company directories (construction, marketing, sales, architects, interior designers): created and edited.
export function logCompanyChanges(entityType: string): CollectionAfterChangeHook {
  return async ({ doc, previousDoc, operation, req }) => {
    try {
      if (operation === 'create') {
        await req.payload.create({ collection: 'developer-activity' as never, overrideAccess: true, data: { entityType, entityId: doc.id, kind: 'profile', title: 'Profile created', detail: doc.name, actor: actorOf(req), at: new Date().toISOString() } as never })
        return doc
      }
      if (!previousDoc) return doc
      const changes = diff(previousDoc, doc, COMPANY_FIELDS)
      if (!changes.length) return doc
      await req.payload.create({ collection: 'developer-activity' as never, overrideAccess: true, data: { entityType, entityId: doc.id, kind: 'profile', title: 'Profile updated', detail: changes.join(', ').slice(0, 480), actor: actorOf(req), at: new Date().toISOString() } as never })
    } catch (error) {
      req.payload.logger.error(`Company activity log failed: ${error instanceof Error ? error.message : error}`)
    }
    return doc
  }
}

import type { Payload } from 'payload'

type AnyDoc = Record<string, unknown>

function relId(value: unknown): string | number | undefined {
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: string | number }).id
  return value as string | number | undefined
}

export type LeadListing = {
  kind: 'project' | 'land'
  id: string | number
  /** Project-shaped document: name, slug, brochureUrl, developer (id), contact. A land's title is exposed as name. */
  doc: AnyDoc
  /** Public page prefix: /projects or /land. */
  basePath: '/projects' | '/land'
}

// A lead belongs to a project or to a land plot. Alerts, reminders and the lead list all read "the listing" through this so a land
// enquiry is handled like a project one (the land's developer is its seller when that is a developer).
export async function loadLeadListing(payload: Payload, lead: { project?: unknown; land?: unknown }): Promise<LeadListing | null> {
  const projectId = relId(lead.project)
  if (projectId) {
    const doc = (await payload.findByID({ collection: 'projects', id: projectId, depth: 0, overrideAccess: true }).catch(() => null)) as unknown as AnyDoc | null
    return doc ? { kind: 'project', id: projectId, doc, basePath: '/projects' } : null
  }
  const landId = relId(lead.land)
  if (!landId) return null
  const land = (await payload.findByID({ collection: 'lands', id: landId, depth: 0, overrideAccess: true }).catch(() => null)) as unknown as AnyDoc | null
  if (!land) return null
  const seller = land.seller as { relationTo?: string; value?: unknown } | null | undefined
  const developer = seller?.relationTo === 'developers' ? relId(seller.value) : undefined
  return { kind: 'land', id: landId, doc: { ...land, name: land.title, developer }, basePath: '/land' }
}

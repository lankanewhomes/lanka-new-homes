import type { CollectionAfterChangeHook, PayloadRequest } from 'payload'

function relatedId(value: unknown): string | number | undefined {
  if (value && typeof value === 'object' && 'id' in value) {
    return (value as { id: string | number }).id
  }
  return value as string | number | undefined
}

const COUNTER_FIELD_BY_EVENT: Record<string, 'view_count' | 'save_count' | 'lead_count' | undefined> = {
  view: 'view_count',
  save: 'save_count',
  lead_submitted: 'lead_count',
  hero_click: undefined, // logged, but no Project counter to bump
}

async function bumpProjectCount(
  req: PayloadRequest,
  projectId: string | number | undefined,
  field: 'view_count' | 'save_count' | 'lead_count',
) {
  if (!projectId) return
  const project = await req.payload.findByID({ collection: 'projects', id: projectId, depth: 0, overrideAccess: true, req })
  if (!project) return
  const current = typeof project[field] === 'number' ? project[field] : 0
  await req.payload.update({
    collection: 'projects',
    id: projectId,
    data: { [field]: current + 1 },
    overrideAccess: true,
    req,
  })
}

// Analytics is the single source of truth for these three counters — see
// Analytics.ts. Creating an Analytics doc (directly via the API, or via the
// Leads/SavedListings hooks below) is the only thing that bumps them.
export const recordAnalyticsEvent: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc
  const field = COUNTER_FIELD_BY_EVENT[doc.event_type as string]
  if (field) await bumpProjectCount(req, relatedId(doc.project), field)
  return doc
}

async function logEvent(
  req: PayloadRequest,
  event_type: 'save' | 'lead_submitted',
  projectId: string | number | undefined,
  userId: string | number | null | undefined,
) {
  if (!projectId) return
  await req.payload.create({
    collection: 'analytics',
    // relatedId() returns string | number generically (it also covers
    // adapters/relations where that's meaningful) — this Postgres setup's
    // ids are always numeric, but narrowing the shared helper isn't worth
    // it here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { project: projectId, event_type, user: userId ?? undefined } as any,
    overrideAccess: true,
    req,
  })
}

// Fired from Leads/SavedListings on create so the corresponding Analytics
// event (and its counter bump) happens automatically — no dependency on the
// future frontend remembering to log it separately.
export const logLeadSubmitted: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation === 'create') await logEvent(req, 'lead_submitted', relatedId(doc.project), relatedId(doc.user))
  return doc
}

export const logSaveEvent: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation === 'create') await logEvent(req, 'save', relatedId(doc.project), relatedId(doc.user))
  return doc
}

import type { CollectionAfterChangeHook, PayloadRequest } from 'payload'

function relatedId(value: unknown): string | number | undefined {
  if (value && typeof value === 'object' && 'id' in value) {
    return (value as { id: string | number }).id
  }
  return value as string | number | undefined
}

type CounterField = 'view_count' | 'save_count' | 'lead_count' | 'download_count' | 'phone_click_count' | 'whatsapp_click_count'

const COUNTER_FIELD_BY_EVENT: Record<string, CounterField | undefined> = {
  view: 'view_count',
  save: 'save_count',
  lead_submitted: 'lead_count',
  hero_click: undefined, // logged, but no Project counter to bump
  brochure_download: 'download_count',
  phone_click: 'phone_click_count',
  whatsapp_click: 'whatsapp_click_count',
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Read-then-write, so two concurrent views on the same project (a real
// visitor + a crawler, two tabs, etc.) can race: both read the same
// current value, both write current+1, and one increment is silently
// lost — or, under enough contention, Postgres detects a genuine deadlock
// (error code 40P01) between the two UPDATEs and kills one. Payload's
// Local API has no atomic "$inc" primitive, and doing a raw SQL increment
// would skip scoreProjectBeforeChange (final_score would go stale for
// view-driven ranking, the most frequent event type) — so this retries
// with a fresh read instead, which is Postgres's own documented remedy
// for 40P01 and keeps every existing hook in the normal update path.
async function bumpProjectCount(
  req: PayloadRequest,
  projectId: string | number | undefined,
  field: CounterField,
  attempt = 1,
) {
  if (!projectId) return
  const project = await req.payload.findByID({ collection: 'projects', id: projectId, depth: 0, overrideAccess: true, req })
  if (!project) return
  const current = typeof project[field] === 'number' ? project[field] : 0
  try {
    await req.payload.update({
      collection: 'projects',
      id: projectId,
      data: { [field]: current + 1 },
      overrideAccess: true,
      req,
    })
  } catch (error) {
    const isDeadlock = (error as { cause?: { code?: string }; code?: string })?.cause?.code === '40P01' || (error as { code?: string })?.code === '40P01'
    if (isDeadlock && attempt < 4) {
      await sleep(25 * attempt + Math.random() * 50)
      return bumpProjectCount(req, projectId, field, attempt + 1)
    }
    throw error
  }
}

// Analytics is the single source of truth for these counters — see
// Analytics.ts. Creating an Analytics doc (directly via the API, or via the
// Leads/SavedListings hooks below) is the only thing that bumps them. A
// duplicate (repeat action, same session, within the dedup window) or
// bot-flagged event is still kept in the log for raw visibility, but never
// counted — see hooks/analytics-dedup.ts for how those flags get set.
export const recordAnalyticsEvent: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc
  if (doc.is_duplicate || doc.is_bot) return doc
  const field = COUNTER_FIELD_BY_EVENT[doc.event_type as string]
  if (field) await bumpProjectCount(req, relatedId(doc.project), field)
  return doc
}

// req.context.analyticsEnrichment lets the caller that created the parent
// doc (Lead, SavedListing) pass through request-derived metadata — session
// id, traffic source, geo, device — collected once at the HTTP route layer,
// without threading those fields through the Leads/SavedListings schemas
// themselves (they're an analytics concern, not part of the record).
type AnalyticsEnrichment = {
  session_id?: string
  traffic_source?: string
  referrer?: string
  city?: string
  region?: string
  device_type?: string
  is_bot?: boolean
}

async function logEvent(
  req: PayloadRequest,
  event_type: 'save' | 'lead_submitted',
  projectId: string | number | undefined,
  userId: string | number | null | undefined,
) {
  if (!projectId) return
  const enrichment = (req.context?.analyticsEnrichment as AnalyticsEnrichment | undefined) ?? {}
  await req.payload.create({
    collection: 'analytics',
    // relatedId() returns string | number generically (it also covers
    // adapters/relations where that's meaningful) — this Postgres setup's
    // ids are always numeric, but narrowing the shared helper isn't worth
    // it here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { project: projectId, event_type, user: userId ?? undefined, ...enrichment } as any,
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

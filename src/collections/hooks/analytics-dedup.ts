import type { CollectionBeforeChangeHook } from 'payload'

const DEDUP_WINDOW_MS = 30 * 60 * 1000 // 30 minutes — same window Supabase's project_views table already uses

function relatedId(value: unknown): string | number | undefined {
  if (value && typeof value === 'object' && 'id' in value) {
    return (value as { id: string | number }).id
  }
  return value as string | number | undefined
}

// Runs on every Analytics event create:
//  1. Auto-fills `developer` from the event's project (never trusts a
//     developer value submitted directly — the project is the only source
//     of truth for who a listing belongs to).
//  2. Flags (not rejects) a repeat action from the same session/project/
//     event type within a 30-minute window as `is_duplicate` — a page
//     refresh, double-click, or back-button revisit shouldn't inflate
//     counts, but the raw event is still kept for full traffic visibility.
//     `is_bot` is set by the calling route (from the User-Agent) before this
//     hook runs — hooks/increment-counts.ts skips both flags when bumping
//     the project's rollup counters.
export const enrichAnalyticsEvent: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || !data) return data

  const projectId = relatedId(data.project)
  if (projectId) {
    const project = await req.payload.findByID({ collection: 'projects', id: projectId, depth: 0, overrideAccess: true, req })
    data.developer = project ? relatedId(project.developer) : undefined
  }

  if (data.session_id && projectId && data.event_type) {
    const since = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString()
    const existing = await req.payload.find({
      collection: 'analytics',
      where: {
        and: [
          { session_id: { equals: data.session_id } },
          { project: { equals: projectId } },
          { event_type: { equals: data.event_type } },
          { is_duplicate: { equals: false } },
          { timestamp: { greater_than_equal: since } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (existing.docs.length > 0) data.is_duplicate = true
  }

  return data
}

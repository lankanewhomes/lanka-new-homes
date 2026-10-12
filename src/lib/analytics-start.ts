// Owner (2026-10-12): "from today I want to see fresh data on my analytics for my listings". Every analytics view (the /cms
// dashboard, each listing's panel, the developer overview, the package digest and the developer stats) counts only events
// from this moment on. Nothing was deleted: the older events are still stored (and backed up), so moving this date earlier
// brings them back. Leads are NOT affected: they are real enquiries and keep their full history.
export const ANALYTICS_START = '2026-10-12T02:50:00.000Z'

/** The later of an ISO timestamp and the analytics start. */
export function fromAnalyticsStart(iso: string): string {
  return iso < ANALYTICS_START ? ANALYTICS_START : iso
}

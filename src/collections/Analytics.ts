import type { CollectionConfig } from 'payload'
import { analyticsOwnerOrAdmin } from './access'
import { enrichAnalyticsEvent } from './hooks/analytics-dedup'
import { recordAnalyticsEvent } from './hooks/increment-counts'

export const ANALYTICS_EVENT_TYPES = [
  { label: 'Page View', value: 'view' },
  { label: 'Save / Favorite', value: 'save' },
  { label: 'Lead Submitted', value: 'lead_submitted' },
  { label: 'Hero Slide Click', value: 'hero_click' },
  { label: 'Brochure Download', value: 'brochure_download' },
  { label: 'Phone Click', value: 'phone_click' },
]

// System-generated raw event log — the single source of truth that drives
// Projects' view_count/save_count/lead_count/download_count/
// phone_click_count (see hooks/increment-counts.ts), and what the per-listing
// analytics panel (ListingAnalyticsPanel) and the GA4 mirror both read from.
//
// Anyone (including guests) can log an event, since virtually all real
// events come from anonymous visitors — `developer` and dedup/bot flags are
// filled in server-side by hooks below, never trusted from the request body.
// A developer can read (and filter/query) events for their own projects
// only; nothing here is ever writable from the admin panel except by an
// admin — every field below is system-generated, not hand-entered.
export const Analytics: CollectionConfig = {
  slug: 'analytics',
  admin: {
    useAsTitle: 'event_type',
    defaultColumns: ['event_type', 'project', 'traffic_source', 'device_type', 'is_duplicate', 'timestamp'],
    // Raw per-event rows aren't useful to look at directly — this replaces
    // the default list table with an aggregated dashboard (stat cards,
    // traffic source/device breakdowns, a by-listing table, trend chart —
    // see AnalyticsDashboard.tsx). The individual event docs are still
    // there and still exportable, just not the landing view anymore.
    components: {
      views: {
        list: {
          Component: '@/components/payload/AnalyticsDashboard#AnalyticsDashboard',
        },
      },
    },
  },
  access: {
    create: () => true,
    read: analyticsOwnerOrAdmin,
    update: () => false, // events are immutable once logged
    delete: analyticsOwnerOrAdmin,
  },
  hooks: {
    beforeChange: [enrichAnalyticsEvent],
    afterChange: [recordAnalyticsEvent],
  },
  fields: [
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true, index: true, label: 'Listing' },
    {
      name: 'developer',
      type: 'relationship',
      relationTo: 'developers',
      index: true,
      label: 'Builder',
      admin: { readOnly: true, description: 'Auto-filled from the listing — the builder this event rolls up to.' },
    },
    {
      name: 'event_type',
      type: 'select',
      label: 'Event Type',
      required: true,
      index: true,
      options: ANALYTICS_EVENT_TYPES,
    },
    { name: 'timestamp', type: 'date', defaultValue: () => new Date().toISOString(), index: true },

    // Identity / dedup.
    {
      name: 'session_id',
      type: 'text',
      label: 'Session ID',
      index: true,
      admin: { description: 'Anonymous per-browser-session id (localStorage) — same one the internal view/session tracking already uses. Used to detect repeat actions.' },
    },
    { name: 'user', type: 'relationship', relationTo: 'users', admin: { description: "The signed-in Payload user, if any — most visitors won't have one." } },
    {
      name: 'is_duplicate',
      type: 'checkbox',
      label: 'Duplicate',
      defaultValue: false,
      index: true,
      admin: { readOnly: true, description: 'Auto-flagged: same session + listing + event type seen again within 30 minutes. Excluded from rollup counters, kept for raw traffic visibility.' },
    },
    {
      name: 'is_bot',
      type: 'checkbox',
      label: 'Bot',
      defaultValue: false,
      index: true,
      admin: { readOnly: true, description: 'Auto-flagged from the User-Agent (crawlers, headless browsers, missing UA). Excluded from rollup counters.' },
    },

    // Attribution.
    { name: 'traffic_source', type: 'text', label: 'Traffic Source', admin: { description: 'organic_search / organic_social / paid_search / paid_social / referral / direct.' } },
    { name: 'referrer', type: 'text', label: 'Referrer URL' },
    { name: 'city', type: 'text' },
    { name: 'region', type: 'text' },
    { name: 'device_type', type: 'select', label: 'Device Type', options: ['desktop', 'mobile', 'tablet', 'unknown'] },
    { name: 'source_page', type: 'text', label: 'Source Page', admin: { description: 'Which page the event happened on, e.g. colombo, sitewide' } },
  ],
}

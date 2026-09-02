import type { CollectionConfig } from 'payload'
import { adminOnly } from './access'
import { recordAnalyticsEvent } from './hooks/increment-counts'

// System-generated event log (page views, saves, lead submissions, hero
// slide clicks) — the single source of truth that drives Projects'
// view_count/save_count/lead_count (see hooks/increment-counts.ts).
// Anyone (including guests) can log an event, since most real events come
// from anonymous visitors; only admins can read/manage the log itself.
export const Analytics: CollectionConfig = {
  slug: 'analytics',
  admin: {
    useAsTitle: 'event_type',
    defaultColumns: ['event_type', 'project', 'source_page', 'timestamp'],
  },
  access: {
    create: () => true,
    read: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    afterChange: [recordAnalyticsEvent],
  },
  fields: [
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true, index: true },
    {
      name: 'event_type',
      type: 'select',
      label: 'Event Type',
      required: true,
      index: true,
      options: ['view', 'save', 'lead_submitted', 'hero_click'],
    },
    { name: 'timestamp', type: 'date', defaultValue: () => new Date().toISOString(), index: true },
    { name: 'user', type: 'relationship', relationTo: 'users' },
    { name: 'source_page', type: 'text', label: 'Source Page', admin: { description: 'Which page the event happened on, e.g. colombo, sitewide' } },
  ],
}

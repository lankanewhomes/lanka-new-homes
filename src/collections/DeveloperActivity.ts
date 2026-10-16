import type { CollectionConfig } from 'payload'
import { adminOnly } from './access'

// The activity timeline of developers, companies, projects and lands (owner, 2026-10-15: "update this when we do changes, send email, etc."). One row per thing that
// happened: profile changes, plan and verification changes, listings published or edited. Written by hooks (src/lib/developer-activity.ts);
// the dashboard Overview tab merges these with emails, enquiries and signup dates. Payload-only, never public.
export const DeveloperActivity: CollectionConfig = {
  slug: 'developer-activity',
  labels: { singular: 'Activity', plural: 'Developer activity' },
  defaultSort: '-at',
  admin: { hidden: true, useAsTitle: 'title', defaultColumns: ['developerName', 'title', 'actor', 'at'] },
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'developer', type: 'relationship', relationTo: 'developers', index: true },
    { name: 'entityType', type: 'text', index: true, label: 'Record type' },
    { name: 'entityId', type: 'number', index: true, label: 'Record id' },
    { name: 'developerName', type: 'text' },
    { name: 'kind', type: 'text', label: 'Type' },
    { name: 'title', type: 'text', required: true },
    { name: 'detail', type: 'text' },
    { name: 'actor', type: 'text', label: 'Done by' },
    { name: 'projectId', type: 'number', index: true },
    { name: 'landId', type: 'number' },
    { name: 'at', type: 'date', required: true, index: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
  ],
}

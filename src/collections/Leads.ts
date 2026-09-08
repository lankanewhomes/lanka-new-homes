import type { CollectionConfig } from 'payload'
import { adminOnlyField, isAdmin, leadOwnerOrDeveloperOrAdmin, ownerOrAdmin } from './access'
import { logLeadSubmitted } from './hooks/increment-counts'
import { notifyDeveloperOfLead, stampFirstResponse, syncLeadStatusToSupabase } from './hooks/lead-hooks'
import { syncLeadToSupabase } from './hooks/sync-to-supabase'

// The pipeline a developer moves each inquiry through. `response_minutes`
// is stamped the first time a lead leaves "New" (hooks/lead-hooks.ts) —
// that is what "responds within 1 hour" will be measured on.
export const LEAD_STATUS_OPTIONS = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Site visit', value: 'site_visit' },
  { label: 'Closed', value: 'closed' },
]

export const LEAD_SOURCE_OPTIONS = [
  { label: 'Request info', value: 'request_info' },
  { label: 'Brochure request', value: 'brochure_request' },
  { label: 'Added manually', value: 'manual' },
]

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    defaultColumns: ['name', 'project', 'floor_plan', 'status', 'response_minutes', 'createdAt'],
    listSearchableFields: ['name', 'email', 'phone'],
  },
  access: {
    create: () => true, // guests can submit without an account
    read: leadOwnerOrDeveloperOrAdmin,
    update: leadOwnerOrDeveloperOrAdmin,
    delete: ownerOrAdmin,
  },
  hooks: {
    beforeValidate: [
      ({ data, req, operation }) => {
        // Trust only the authenticated requester's own id (or none, for a
        // guest submission) — never a `user` value submitted in the body.
        if (operation === 'create' && !isAdmin(req)) {
          return { ...data, user: req.user ? req.user.id : undefined }
        }
        return data
      },
    ],
    afterChange: [logLeadSubmitted, syncLeadToSupabase, notifyDeveloperOfLead, stampFirstResponse, syncLeadStatusToSupabase],
  },
  fields: [
    // A developer's document-level update access (leadOwnerOrDeveloperOrAdmin
    // above) covers the whole lead, but they should only ever change
    // `status` — every other field keeps the buyer's original submission
    // locked to admin-only edits via this field-level access.
    { name: 'user', type: 'relationship', relationTo: 'users', index: true, access: { update: adminOnlyField } },
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true, index: true, access: { update: adminOnlyField } },
    {
      name: 'floor_plan',
      type: 'text',
      label: 'Floor plan',
      access: { update: adminOnlyField },
      admin: { description: 'Set automatically when the buyer asked from a floor-plan page (e.g. "Unit A · 3 bed · 1,300 SqFt").' },
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'request_info',
      options: LEAD_SOURCE_OPTIONS,
      access: { update: adminOnlyField },
    },
    { name: 'name', type: 'text', required: true, access: { update: adminOnlyField } },
    { name: 'email', type: 'email', required: true, access: { update: adminOnlyField } },
    { name: 'phone', type: 'text', access: { update: adminOnlyField } },
    { name: 'preferred_contact_method', type: 'text', label: 'Preferred contact', access: { update: adminOnlyField } },
    { name: 'message', type: 'textarea', access: { update: adminOnlyField } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      index: true,
      options: LEAD_STATUS_OPTIONS,
      admin: { description: 'Move each inquiry along: New → Contacted → Site visit → Closed. Your first move off "New" is timed as your response.' },
    },
    {
      name: 'first_response_at',
      type: 'date',
      label: 'First response',
      access: { update: adminOnlyField },
      admin: { readOnly: true, position: 'sidebar', date: { pickerAppearance: 'dayAndTime' }, description: 'When this lead first left "New".' },
    },
    {
      name: 'response_minutes',
      type: 'number',
      label: 'Response time (minutes)',
      access: { update: adminOnlyField },
      admin: { readOnly: true, position: 'sidebar' },
    },
    // Id of the mirrored row in Supabase `leads` (what the buyer's account
    // page reads) so status changes here can be copied across.
    { name: 'supabase_lead_id', type: 'text', access: { update: adminOnlyField }, admin: { hidden: true } },
  ],
}

import type { CollectionConfig } from 'payload'
import { adminOnlyField, isAdmin, leadOwnerOrDeveloperOrAdmin, ownerOrAdmin } from './access'
import { logLeadSubmitted } from './hooks/increment-counts'
import { syncLeadToSupabase } from './hooks/sync-to-supabase'

export const LEAD_STATUS_OPTIONS = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Toured', value: 'toured' },
  { label: 'Sold', value: 'sold' },
]

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: { defaultColumns: ['name', 'project', 'email', 'status', 'createdAt'] },
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
    afterChange: [logLeadSubmitted, syncLeadToSupabase],
  },
  fields: [
    // A developer's document-level update access (leadOwnerOrDeveloperOrAdmin
    // above) covers the whole lead, but they should only ever change
    // `status` — every other field keeps the buyer's original submission
    // locked to admin-only edits via this field-level access.
    { name: 'user', type: 'relationship', relationTo: 'users', index: true, access: { update: adminOnlyField } },
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true, index: true, access: { update: adminOnlyField } },
    { name: 'name', type: 'text', required: true, access: { update: adminOnlyField } },
    { name: 'email', type: 'email', required: true, access: { update: adminOnlyField } },
    { name: 'phone', type: 'text', access: { update: adminOnlyField } },
    { name: 'message', type: 'textarea', access: { update: adminOnlyField } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      index: true,
      options: LEAD_STATUS_OPTIONS,
      admin: { description: 'Update as this inquiry progresses — drives the lead-status breakdown on the project analytics panel.' },
    },
  ],
}

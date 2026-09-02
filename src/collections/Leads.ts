import type { CollectionConfig } from 'payload'
import { isAdmin, ownerOrAdmin } from './access'
import { logLeadSubmitted } from './hooks/increment-counts'
import { syncLeadToSupabase } from './hooks/sync-to-supabase'

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: { defaultColumns: ['name', 'project', 'email', 'createdAt'] },
  access: {
    create: () => true, // guests can submit without an account
    read: ownerOrAdmin,
    update: ownerOrAdmin,
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
    { name: 'user', type: 'relationship', relationTo: 'users', index: true },
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text' },
    { name: 'message', type: 'textarea' },
  ],
}

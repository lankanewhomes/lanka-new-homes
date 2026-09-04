import type { CollectionConfig } from 'payload'
import { adminOnly, adminOnlyField, ownDeveloperAccess } from './access'
import { syncReviewToSupabase } from './hooks/sync-to-supabase'

// Public buyer reviews on a developer's profile. Anyone can submit one
// (guest, no account needed — matches Leads), but nothing shows up on the
// live site until either the reviewed developer or an admin approves it
// (`ownDeveloperAccess('developer')` below), same self-service-create,
// admin/owner-approves pattern used by HeroSlides/Payments.
export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: { defaultColumns: ['developer', 'rating', 'reviewer_name', 'status', 'createdAt'] },
  access: {
    create: () => true,
    read: ownDeveloperAccess('developer'),
    update: ownDeveloperAccess('developer'),
    delete: adminOnly,
  },
  hooks: {
    afterChange: [syncReviewToSupabase],
  },
  fields: [
    // Everything about the submitted review itself is locked to admin-only
    // edits once created — a developer's ownDeveloperAccess above only
    // needs to reach `status` to approve/reject it, never rewrite what a
    // buyer actually said.
    { name: 'developer', type: 'relationship', relationTo: 'developers', required: true, index: true, access: { update: adminOnlyField } },
    { name: 'project', type: 'relationship', relationTo: 'projects', access: { update: adminOnlyField } },
    { name: 'rating', type: 'number', required: true, min: 1, max: 5, access: { update: adminOnlyField } },
    { name: 'comment', type: 'textarea', required: true, access: { update: adminOnlyField } },
    { name: 'reviewer_name', type: 'text', required: true, label: 'Reviewer Name', access: { update: adminOnlyField } },
    { name: 'reviewer_email', type: 'email', label: 'Reviewer Email', access: { update: adminOnlyField } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: ['pending', 'approved', 'rejected'],
      admin: { description: 'Approved reviews show on the developer\'s public profile page.' },
    },
  ],
}

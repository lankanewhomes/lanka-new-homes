import { APIError } from 'payload'
import type { CollectionConfig } from 'payload'
import { adminOnly, adminOnlyField, ownDeveloperAccess } from './access'
import { syncReviewToSupabase } from './hooks/sync-to-supabase'

// Public buyer reviews on a profile page — a developer's, or (since
// 2026-09-08) any partner directory profile: marketing/sales company,
// architect, interior designer, construction company. Anyone can submit one
// (guest, no account needed — matches Leads), but nothing shows up on the
// live site until it's approved: a developer can approve reviews of
// themselves (`ownDeveloperAccess('developer')` below), company reviews are
// admin-approved, same self-service-create, admin/owner-approves pattern
// used by HeroSlides/Payments.
//
// `entity_type` says which kind of profile; `developer` holds the target for
// developer reviews and the polymorphic `company` field for everything else.
// The sync hook writes `entity_type` + `entity_slug` to Supabase, which is
// what the public pages query.
const COMPANY_REVIEW_COLLECTIONS = ['marketing-companies', 'sales-companies', 'architects', 'interior-designers', 'construction-companies'] as const
const ENTITY_TYPE_OPTIONS = [
  { label: 'Developer', value: 'developer' },
  { label: 'Marketing Company', value: 'marketing-company' },
  { label: 'Sales Company', value: 'sales-company' },
  { label: 'Architect', value: 'architect' },
  { label: 'Interior Designer', value: 'interior-designer' },
  { label: 'Construction Company', value: 'construction-company' },
]

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: { defaultColumns: ['entity_type', 'developer', 'company', 'rating', 'reviewer_name', 'status', 'createdAt'] },
  access: {
    create: () => true,
    read: ownDeveloperAccess('developer'),
    update: ownDeveloperAccess('developer'),
    delete: adminOnly,
  },
  hooks: {
    // Exactly one target per review: `developer` for developer reviews,
    // `company` for everything else. Merged with originalDoc so a partial
    // update (an admin flipping `status`) doesn't trip it.
    beforeValidate: [
      ({ data, originalDoc }) => {
        const merged = { ...(originalDoc ?? {}), ...(data ?? {}) } as { entity_type?: string; developer?: unknown; company?: unknown }
        const type = merged.entity_type ?? 'developer'
        if (type === 'developer' && !merged.developer) throw new APIError('Pick the developer being reviewed.', 400)
        if (type !== 'developer' && !merged.company) throw new APIError('Pick the company being reviewed.', 400)
        return data
      },
    ],
    afterChange: [syncReviewToSupabase],
  },
  fields: [
    // Everything about the submitted review itself is locked to admin-only
    // edits once created — a developer's ownDeveloperAccess above only
    // needs to reach `status` to approve/reject it, never rewrite what a
    // buyer actually said.
    {
      name: 'entity_type',
      type: 'select',
      label: 'Reviewed profile type',
      required: true,
      defaultValue: 'developer',
      index: true,
      options: ENTITY_TYPE_OPTIONS,
      access: { update: adminOnlyField },
    },
    {
      name: 'developer',
      type: 'relationship',
      relationTo: 'developers',
      index: true,
      access: { update: adminOnlyField },
      admin: { condition: (data) => !data?.entity_type || data.entity_type === 'developer' },
    },
    {
      name: 'company',
      type: 'relationship',
      relationTo: [...COMPANY_REVIEW_COLLECTIONS],
      label: 'Reviewed company',
      access: { update: adminOnlyField },
      admin: {
        condition: (data) => Boolean(data?.entity_type) && data.entity_type !== 'developer',
        description: 'The marketing/sales company, architect, interior designer or construction company being reviewed.',
      },
    },
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

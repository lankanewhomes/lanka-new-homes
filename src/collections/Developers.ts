import type { CollectionConfig } from 'payload'
import { adminOnly, adminOnlyField, getOwnedDeveloperIds, getRole, isAdmin, publicRead } from './access'
import { companyProfileFields, seoFields, socialLinksField } from './shared-fields'
import { syncDeveloperToSupabase } from './hooks/sync-to-supabase'

export const Developers: CollectionConfig = {
  slug: 'developers',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'user'],
    // Same idea as Projects' baseListFilter — read access is public (real
    // visitors need the whole directory), but a developer's own /cms list
    // view should default to just their own company, not every developer.
    baseListFilter: async ({ req }) => {
      if (isAdmin(req)) return null
      const ownedIds = await getOwnedDeveloperIds(req)
      return ownedIds.length > 0 ? { id: { in: ownedIds } } : null
    },
  },
  access: {
    read: publicRead,
    // An admin can create any profile. A developer-role account with no
    // company profile of their own yet can self-register one (self-service
    // signup) — forced to status: 'pending' and linked to themselves by
    // the beforeChange hook below, same "self-service create, admin
    // approves" pattern as Payments/HeroSlides. A developer who already
    // owns a profile can't create a second one.
    create: async ({ req }) => {
      if (isAdmin(req)) return true
      if (getRole(req) !== 'developer') return false
      const ownedIds = await getOwnedDeveloperIds(req)
      return ownedIds.length === 0
    },
    // Delete and verification/ownership changes (below) stay admin-only —
    // the linked developer account can edit everything else about their
    // own profile.
    update: async ({ req }) => {
      if (isAdmin(req)) return true
      const ownedIds = await getOwnedDeveloperIds(req)
      return ownedIds.length > 0 ? { id: { in: ownedIds } } : false
    },
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create' && !isAdmin(req)) {
          return { ...data, user: req.user ? req.user.id : undefined, verification_status: 'pending' }
        }
        return data
      },
    ],
    afterChange: [syncDeveloperToSupabase],
  },
  fields: [
    ...companyProfileFields([{ name: 'website', type: 'text' }, { name: 'location', type: 'text', label: 'Primary Location', admin: { description: 'e.g. Colombo 03' } }]),
    { name: 'establishedYear', type: 'number', label: 'Established Year' },
    { name: 'yearsInBusiness', type: 'number', label: 'Years in Business' },
    { name: 'activeProjects', type: 'number', label: 'Active Projects' },
    { name: 'completedProjects', type: 'number', label: 'Completed Projects' },
    {
      name: 'coDevelopers',
      type: 'array',
      label: 'Co-Developers (external, not in system)',
      admin: { description: 'Free-text credits for co-developers that don’t have a Developer record here — shown on the public builder page.' },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'href', type: 'text' },
      ],
    },
    {
      name: 'officeHours',
      type: 'array',
      label: 'Office Hours',
      fields: [
        { name: 'day', type: 'select', required: true, options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
        { name: 'open', type: 'checkbox', label: 'Open', defaultValue: false },
        { name: 'from', type: 'text', admin: { condition: (_, siblingData) => Boolean(siblingData?.open) } },
        { name: 'to', type: 'text', admin: { condition: (_, siblingData) => Boolean(siblingData?.open) } },
      ],
    },
    socialLinksField,
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      filterOptions: { role: { equals: 'developer' } },
      access: { update: adminOnlyField },
      admin: { description: 'The developer-role account that manages this company profile.' },
    },
    { name: 'projects', type: 'join', collection: 'projects', on: 'developer' },
    { name: 'team_members', type: 'join', collection: 'team-members', on: 'company', label: 'Team Members' },
    {
      name: 'verification_status',
      type: 'select',
      label: 'Verification Status',
      defaultValue: 'pending',
      options: ['pending', 'approved', 'rejected', 'changes_requested'],
      access: { update: adminOnlyField },
      admin: { description: 'Gates the "Developer approval" workflow — new self-registered developers start pending.' },
    },
    seoFields,
  ],
}

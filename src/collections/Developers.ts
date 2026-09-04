import type { CollectionConfig } from 'payload'
import { adminOnly, adminOnlyField, getOwnedDeveloperIds, isAdmin, publicRead } from './access'
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
    // Only admins create new company profiles (and delete), but the linked
    // developer account can edit their own — verification_status and the
    // `user` link itself stay admin-only via field-level access below.
    create: adminOnly,
    update: async ({ req }) => {
      if (isAdmin(req)) return true
      const ownedIds = await getOwnedDeveloperIds(req)
      return ownedIds.length > 0 ? { id: { in: ownedIds } } : false
    },
    delete: adminOnly,
  },
  hooks: { afterChange: [syncDeveloperToSupabase] },
  fields: [
    ...companyProfileFields([{ name: 'website', type: 'text' }]),
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

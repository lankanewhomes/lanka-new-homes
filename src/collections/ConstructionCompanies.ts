import type { CollectionConfig } from 'payload'
import { adminOnly, hiddenUnlessAdmin, publicRead } from './access'
import { companyProfileFields } from './shared-fields'
import { syncConstructionCompanyToSupabase } from './hooks/sync-to-supabase'

// Unlike Marketing/Sales Companies and Architects, Construction Companies
// can have a linked user account (construction_company role, self-
// registered like Developers) — but same as Developers, the company
// profile record itself stays admin-only to create/edit.
export const ConstructionCompanies: CollectionConfig = {
  slug: 'construction-companies',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug', 'user'], hidden: hiddenUnlessAdmin },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: { afterChange: [syncConstructionCompanyToSupabase] },
  fields: [
    ...companyProfileFields([{ name: 'services', type: 'text', hasMany: true }]),
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      filterOptions: { role: { equals: 'construction_company' } },
      admin: { description: 'The construction_company-role account that manages this profile.' },
    },
    { name: 'team_members', type: 'join', collection: 'team-members', on: 'company', label: 'Team Members' },
  ],
}

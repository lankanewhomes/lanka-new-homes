import type { CollectionConfig } from 'payload'
import { adminOnly, publicRead } from './access'
import { companyProfileFields, seoFields, socialLinksField } from './shared-fields'
import { syncDeveloperToSupabase } from './hooks/sync-to-supabase'

export const Developers: CollectionConfig = {
  slug: 'developers',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug', 'user'] },
  access: {
    read: publicRead,
    // Only admins create/edit company profiles — a developer's own linked
    // user account can still create/edit their own Projects (Projects.ts),
    // just not this profile record itself.
    create: adminOnly,
    update: adminOnly,
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
      admin: { description: 'Gates the "Developer approval" workflow — new self-registered developers start pending.' },
    },
    seoFields,
  ],
}

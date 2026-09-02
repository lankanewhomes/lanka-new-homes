import type { CollectionConfig } from 'payload'
import { ownPayerAccess } from './access'

// Lets a Developer or Construction Company (builder) — whichever role owns
// the company profile via its `user` field — add additional staff logins
// under the same company, beyond the one primary account. Reuses
// ownPayerAccess (originally built for Payments' polymorphic `payer`
// field) since the ownership check is identical: does the requester's role
// + linked company profile match the `company` this record points at.
export const TeamMembers: CollectionConfig = {
  slug: 'team-members',
  admin: {
    useAsTitle: 'role',
    defaultColumns: ['company', 'user', 'role'],
  },
  access: {
    read: ownPayerAccess('company'),
    create: ownPayerAccess('company'),
    update: ownPayerAccess('company'),
    delete: ownPayerAccess('company'),
  },
  fields: [
    {
      name: 'company',
      type: 'relationship',
      relationTo: ['developers', 'construction-companies'],
      required: true,
      index: true,
    },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'member',
      options: ['owner', 'sales', 'marketing', 'member'],
    },
  ],
}

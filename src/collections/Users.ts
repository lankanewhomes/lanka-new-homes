import type { CollectionConfig, PayloadRequest } from 'payload'
import { adminOnly, adminOnlyField, adminOrSelfById, isAdmin } from './access'
import { magicLinkEndpoints } from './auth/magic-link'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7, // 7 days
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'full_name', 'role'],
  },
  access: {
    // Public so buyers/developers can self-register; the `role` field below
    // is what actually keeps them from granting themselves admin.
    create: () => true,
    read: adminOrSelfById,
    update: adminOrSelfById,
    delete: adminOnly,
  },
  endpoints: magicLinkEndpoints,
  fields: [
    { name: 'full_name', type: 'text', label: 'Full Name', required: true },
    { name: 'phone', type: 'text' },
    {
      name: 'role',
      type: 'select',
      required: true,
      // No defaultValue on purpose: the very first account created at
      // /payload-admin (while this collection is still empty) must
      // explicitly choose "Admin" — see the validate bootstrap branch below.
      options: [
        { label: 'Buyer', value: 'buyer' },
        { label: 'Developer', value: 'developer' },
        { label: 'Construction Company', value: 'construction_company' },
        { label: 'Admin', value: 'admin' },
      ],
      saveToJWT: true,
      access: {
        // Anyone can set it at create time (self-registration); only an
        // admin can change it afterwards.
        update: adminOnlyField,
      },
      validate: async (
        value: unknown,
        { previousValue, req }: { previousValue?: unknown; req: PayloadRequest },
      ) => {
        // Only gate an actual change *to* admin — an unrelated update to an
        // already-admin doc (e.g. the magic-link callback recording a
        // session) re-submits the unchanged value and must not be blocked.
        if (value !== 'admin' || previousValue === 'admin') return true
        if (isAdmin(req)) return true
        const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true, req })
        if (totalDocs === 0) return true // bootstrap: first user ever created
        return 'Only an existing admin can grant the admin role.'
      },
    },
  ],
}

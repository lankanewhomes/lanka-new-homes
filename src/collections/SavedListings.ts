import type { CollectionConfig } from 'payload'
import { authenticatedCreate, ownerOrAdmin } from './access'
import { logSaveEvent } from './hooks/increment-counts'

export const SavedListings: CollectionConfig = {
  slug: 'saved-listings',
  admin: { defaultColumns: ['user', 'project', 'createdAt'] },
  access: {
    create: authenticatedCreate,
    read: ownerOrAdmin,
    update: ownerOrAdmin,
    delete: ownerOrAdmin,
  },
  hooks: {
    beforeValidate: [
      ({ data, req, operation }) => {
        // Always the requesting user's own id — never trust a submitted one.
        if (operation === 'create' && req.user) return { ...data, user: req.user.id }
        return data
      },
    ],
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create' && data?.user && data?.project) {
          const existing = await req.payload.find({
            collection: 'saved-listings',
            where: { and: [{ user: { equals: data.user } }, { project: { equals: data.project } }] },
            limit: 1,
            depth: 0,
            overrideAccess: true,
            req,
          })
          if (existing.docs.length > 0) throw new Error('This project is already saved.')
        }
        return data
      },
    ],
    afterChange: [logSaveEvent],
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true, index: true },
  ],
}

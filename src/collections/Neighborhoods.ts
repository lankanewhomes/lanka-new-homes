import type { CollectionConfig } from 'payload'
import { adminOnly, publicRead } from './access'
import { seoFields } from './shared-fields'
import { syncNeighborhoodToSupabase } from './hooks/sync-to-supabase'

export const Neighborhoods: CollectionConfig = {
  slug: 'neighborhoods',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug', 'city'] },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: { afterChange: [syncNeighborhoodToSupabase] },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'city', type: 'text' },
    { name: 'province', type: 'text' },
    { name: 'description', type: 'textarea' },
    { name: 'heroImage', type: 'text', admin: { description: 'Image URL — or upload a file in Media and paste its URL here.' } },
    seoFields,
  ],
}

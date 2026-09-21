import type { CollectionConfig } from 'payload'
import { adminOnly, hiddenUnlessAdmin, publicRead } from './access'
import { nearbyField, seoFields } from './shared-fields'
import { syncNeighborhoodDeleteToSupabase, syncNeighborhoodToSupabase } from './hooks/sync-to-supabase'

export const Neighborhoods: CollectionConfig = {
  slug: 'neighborhoods',
  admin: { useAsTitle: 'name', group: 'Properties', defaultColumns: ['name', 'slug', 'city'], hidden: hiddenUnlessAdmin },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: { afterChange: [syncNeighborhoodToSupabase], afterDelete: [syncNeighborhoodDeleteToSupabase] },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'city', type: 'text' },
    { name: 'province', type: 'text' },
    { name: 'description', type: 'textarea' },
    { name: 'heroImage', type: 'text', admin: { description: 'Image URL — or upload a file in Media and paste its URL here.' } },
    {
      name: 'highlights',
      type: 'text',
      hasMany: true,
      label: 'Key Highlights',
      admin: { description: '3-5 short standout facts shown at the top of the neighborhood page (e.g. "16 km from central Colombo").' },
    },
    {
      name: 'gallery',
      type: 'array',
      label: 'Photo Gallery',
      admin: {
        description: 'More photos of the area — famous landmarks (a well-known school, park, mall, temple, beach) work best. Sharp, at least 2400px wide, never a listing render. The hero image above stays the page banner.',
      },
      fields: [
        { name: 'url', type: 'text', required: true, admin: { description: 'Image URL — or upload a file in Media and paste its URL here.' } },
        { name: 'caption', type: 'text', admin: { description: 'What the photo shows, e.g. "Mount Lavinia Hotel".' } },
        { name: 'credit', type: 'text', admin: { description: 'Photographer credit, e.g. "Photo: Zoshua Colah / Unsplash". Required for Creative Commons photos.' } },
        { name: 'sourceUrl', type: 'text', admin: { description: 'Link to the original photo page (the credit links here).' } },
      ],
    },
    nearbyField,
    seoFields,
  ],
}

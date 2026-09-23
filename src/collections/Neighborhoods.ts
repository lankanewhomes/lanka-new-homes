import type { CollectionConfig } from 'payload'
import { adminOnly, hiddenUnlessAdmin, publicRead } from './access'
import { neighborhoodNearbyField, seoFields } from './shared-fields'
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
    { name: 'population', type: 'text', admin: { description: 'Population with its scope and year, e.g. "17,588 in the Grandpass South division (2012 census)". Shown as the first line of the Overview list.' } },
    { name: 'district', type: 'text', admin: { description: 'e.g. "Colombo District". Shown as a quick-facts chip.' } },
    { name: 'approxLocation', type: 'text', admin: { description: 'One short line on where the area is, e.g. "About 9 km from Colombo Fort by road". Quick-facts chip.' } },
    {
      name: 'nearbyAreas',
      type: 'text',
      hasMany: true,
      admin: { description: 'Neighbouring areas, nearest first (4-6). A name that matches another neighborhood page links to it. Feeds the "Nearby major areas" chip and the "Explore nearby areas" links.' },
    },
    { name: 'latitude', type: 'number', admin: { description: 'Centre of the area map.' } },
    { name: 'longitude', type: 'number', admin: { description: 'Centre of the area map.' } },
    { name: 'mapRadiusKm', type: 'number', admin: { description: 'Radius (km) of the "approximate area" circle drawn on the map, usually 1-3.' } },
    { name: 'description', type: 'textarea', label: 'About the neighbourhood', admin: { description: '300-600 words, paragraphs separated by a blank line: where it is, what it is known for, connectivity, lifestyle, development activity, who looks for property there. No prices, no property-portal names.' } },
    {
      name: 'sources',
      type: 'array',
      admin: { description: 'Where the facts above came from. Printed as "Source: …" under the overview. Official and reference pages only, never property portals.' },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text' },
      ],
    },
    {
      name: 'faqs',
      type: 'array',
      label: 'FAQs (authored)',
      admin: { description: 'Two authored answers: what the area is known for, and whether it is close to Colombo. The questions about new homes and projects are generated on the page from the live listings.' },
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
    { name: 'heroImage', type: 'text', admin: { description: 'Image URL — or upload a file in Media and paste its URL here.' } },
    { name: 'heroImageCredit', type: 'text', admin: { description: 'Photographer credit for the hero photo, e.g. "Photo: Zoshua Colah / Unsplash". Required for Creative Commons photos; shown under the photo gallery.' } },
    { name: 'heroImageSourceUrl', type: 'text', admin: { description: 'Link to the original hero photo page (the credit links here).' } },
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
        { name: 'landmark', type: 'text', admin: { description: 'Optional. Name of the Known Landmark this photo shows — it must match a Nearby place name exactly. Photos with a landmark appear in the Known Landmarks section; the others appear in the Photos section.' } },
      ],
    },
    neighborhoodNearbyField,
    seoFields,
  ],
}

import type { CollectionConfig } from 'payload'
import { adminOnly, hiddenUnlessAdmin } from './access'

// The owner's own "what is left to do" list for every listing (projects, land) — one row per task, shown as a simple table
// at /cms/collections/listing-todos with a tick box to check a task off (owner, 2026-10-11: "have it in table and simple and
// also have option to check it off if its done"). Payload-only: internal working notes, never read by the public site.
export const ListingTodos: CollectionConfig = {
  slug: 'listing-todos',
  labels: { singular: 'To-do', plural: 'To-do list' },
  defaultSort: 'done',
  admin: {
    group: 'Properties',
    useAsTitle: 'title',
    defaultColumns: ['listingName', 'title', 'done', 'sourceLinks', 'updatedAt'],
    hidden: hiddenUnlessAdmin,
    description: 'What is left to do on each listing. Tick the box to check a task off. Open tasks are listed first.',
  },
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const next = { ...data }
        // Keep a plain-text listing name on the row so the table can show it without loading the listing.
        const projectId = next.project ?? originalDoc?.project
        const landId = next.land ?? originalDoc?.land
        const type = next.listingType ?? originalDoc?.listingType
        try {
          if (type === 'project' && projectId) {
            const doc = await req.payload.findByID({ collection: 'projects', id: typeof projectId === 'object' ? projectId.id : projectId, depth: 0, req })
            next.listingName = (doc as { name?: string }).name ?? ''
          } else if (type === 'land' && landId) {
            const doc = await req.payload.findByID({ collection: 'lands', id: typeof landId === 'object' ? landId.id : landId, depth: 0, req })
            next.listingName = (doc as { title?: string }).title ?? ''
          } else if (type === 'other' && !next.listingName) {
            next.listingName = 'General'
          }
        } catch {
          /* listing not found: keep whatever name was already there */
        }
        if (typeof next.done === 'boolean' && next.done !== Boolean(originalDoc?.done)) next.doneAt = next.done ? new Date().toISOString() : null
        return next
      },
    ],
  },
  fields: [
    { name: 'listingName', type: 'text', label: 'Listing', index: true, admin: { readOnly: true, position: 'sidebar', description: 'Filled in automatically from the listing you pick.', components: { Cell: '@/components/payload/ListingCells#TodoListingCell' } } },
    { name: 'title', type: 'text', required: true, label: 'What needs doing' },
    { name: 'done', type: 'checkbox', label: 'Done', defaultValue: false, index: true, admin: { components: { Cell: '@/components/payload/ListingCells#TodoDoneCell' } } },
    {
      name: 'listingType',
      type: 'select',
      label: 'Applies to',
      defaultValue: 'project',
      required: true,
      options: [
        { label: 'A project', value: 'project' },
        { label: 'A land listing', value: 'land' },
        { label: 'General (no single listing)', value: 'other' },
      ],
    },
    { name: 'project', type: 'relationship', relationTo: 'projects', admin: { condition: (data) => data?.listingType === 'project' } },
    { name: 'land', type: 'relationship', relationTo: 'lands', admin: { condition: (data) => data?.listingType === 'land' } },
    { name: 'sourceLinks', type: 'textarea', label: 'Links', admin: { description: 'Where the information came from and where to look: one link per line.', components: { Cell: '@/components/payload/ListingCells#TodoLinksCell' } } },
    { name: 'notes', type: 'textarea' },
    { name: 'doneAt', type: 'date', label: 'Checked off on', admin: { readOnly: true, position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } } },
  ],
}

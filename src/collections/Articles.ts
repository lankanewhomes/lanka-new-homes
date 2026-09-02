import type { CollectionConfig } from 'payload'
import { adminOnly, publicRead } from './access'

// Was static data (src/data/articles.ts) — matches that Article type's
// fields, plus `content`/`publishedDate`/`author` since a real CMS
// collection needs an actual body to author, not just a card preview.
export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedDate'],
  },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'title', type: 'text', required: true },
    { name: 'excerpt', type: 'textarea', required: true },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: ['Buying Guide', 'Market Insight', 'Finance'],
    },
    { name: 'readTime', type: 'text', label: 'Read Time', admin: { description: 'e.g. "5 min read"' } },
    { name: 'image', type: 'text', admin: { description: 'Image URL — or upload a file in Media and paste its URL here.' } },
    { name: 'author', type: 'text' },
    { name: 'publishedDate', type: 'date', label: 'Published Date' },
    { name: 'content', type: 'richText' },
  ],
}

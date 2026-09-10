import type { CollectionConfig } from 'payload'
import { authenticatedCreate, publicRead } from './access'

// Backs the "upload a file" option next to every URL field across Projects/
// Lands/Developers/etc. (heroImage, gallery, brochureUrl, videos, virtual
// tours, logos...) — those fields stay plain URL text fields (matching what
// the existing Supabase-reading frontend already expects), so uploading
// here just gives you a URL to paste into one of them, same as any other
// image host. Files land in Cloudflare R2 (src/collections/storage/
// r2-storage.ts) when the R2_* env vars are set, otherwise in Supabase
// Storage's "media" bucket (supabase-storage-adapter.ts) — see
// payload.config.ts.
export const Media: CollectionConfig = {
  slug: 'media',
  admin: { useAsTitle: 'filename', group: 'Content' },
  access: {
    read: publicRead,
    create: authenticatedCreate,
    update: authenticatedCreate,
    delete: authenticatedCreate,
  },
  upload: {
    mimeTypes: ['image/*', 'video/*', 'application/pdf'],
  },
  fields: [
    { name: 'alt', type: 'text', label: 'Alt Text', admin: { description: 'Describes the file for accessibility/SEO — required for images.' } },
  ],
}

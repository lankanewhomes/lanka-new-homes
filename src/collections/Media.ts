import type { CollectionConfig } from 'payload'
import { authenticatedCreate, publicRead } from './access'

// Backs the "upload a file" option next to every URL field across Projects/
// Lands/Developers/etc. (heroImage, gallery, brochureUrl, videos, virtual
// tours, logos...) — those fields stay plain URL text fields (matching what
// the existing Supabase-reading frontend already expects), so uploading
// here just gives you a URL to paste into one of them, same as any other
// image host. See src/collections/storage/supabase-storage-adapter.ts for
// where the files actually land (Supabase Storage's "media" bucket).
export const Media: CollectionConfig = {
  slug: 'media',
  admin: { useAsTitle: 'filename' },
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

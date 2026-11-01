import type { Access, CollectionConfig } from 'payload'
import { adminOnly, publicRead } from './access'

// Any signed-in CMS user except a plain buyer may upload; only an admin may replace or delete files (a self-registered buyer
// account used to be able to delete every image on the site, closed 2026-11-01).
const uploaderRoles = new Set(['admin', 'developer', 'construction_company'])
const canUpload: Access = ({ req }) => uploaderRoles.has(String((req.user as { role?: string } | null)?.role ?? ''))

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
  admin: {
    useAsTitle: 'filename',
    group: 'Content',
    defaultColumns: ['alt', 'mimeType', 'filesize', 'createdAt'],
    components: { beforeListTable: ['@/components/payload/MediaListTabs#MediaListTabs'] },
  },
  access: {
    read: publicRead,
    create: canUpload,
    update: adminOnly,
    delete: adminOnly,
  },
  upload: {
    mimeTypes: ['image/*', 'video/*', 'application/pdf'],
  },
  fields: [
    { name: 'alt', type: 'text', label: 'Alt Text', admin: { components: { Cell: '@/components/payload/ListingCells#MediaCell' }, description: 'Describes the file for accessibility/SEO — required for images.' } },
  ],
}

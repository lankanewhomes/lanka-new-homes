import type { CollectionConfig } from 'payload'
import { adminOnly, hiddenUnlessAdmin } from './access'

// Append-only log of every attempt to post a listing to Facebook /
// Instagram (src/lib/social/publish.ts). `processing` rows are Instagram
// containers Meta is still encoding — the Social tab's "Check & publish"
// finishes them. `dry_run` rows are what would have been posted while the
// Meta credentials aren't configured yet.
export const SOCIAL_PLATFORMS = [
  { label: 'Facebook Page', value: 'facebook' },
  { label: 'Instagram', value: 'instagram' },
] as const
export const SOCIAL_KINDS = [
  { label: 'Photo carousel', value: 'carousel' },
  { label: 'Reel / video', value: 'reel' },
] as const
export const SOCIAL_STATUSES = [
  { label: 'Published', value: 'published' },
  { label: 'Processing', value: 'processing' },
  { label: 'Failed', value: 'failed' },
  { label: 'Dry run', value: 'dry_run' },
] as const

export const SocialPosts: CollectionConfig = {
  slug: 'social-posts',
  admin: {
    group: 'Marketing',
    useAsTitle: 'id',
    defaultColumns: ['project', 'platform', 'kind', 'status', 'permalink', 'postedAt'],
    hidden: hiddenUnlessAdmin,
  },
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true, index: true },
    { name: 'platform', type: 'select', options: [...SOCIAL_PLATFORMS], required: true },
    { name: 'kind', type: 'select', options: [...SOCIAL_KINDS], required: true },
    { name: 'status', type: 'select', options: [...SOCIAL_STATUSES], required: true },
    { name: 'externalId', type: 'text', admin: { description: 'Post / video / media id on Meta.' } },
    { name: 'creationId', type: 'text', admin: { description: 'Instagram container id (until published).' } },
    { name: 'permalink', type: 'text' },
    { name: 'caption', type: 'textarea' },
    { name: 'error', type: 'text' },
    { name: 'triggeredBy', type: 'text', admin: { description: 'User email, or "auto-post".' } },
    { name: 'details', type: 'json', admin: { description: 'Media URLs sent (dry runs keep the whole would-be request here).' } },
    { name: 'postedAt', type: 'date' },
  ],
}

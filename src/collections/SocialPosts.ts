import type { CollectionConfig } from 'payload'
import { adminOnly, hiddenUnlessAdmin, projectContentRead } from './access'

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
  { label: 'Photo post', value: 'photo' },
  { label: 'Video', value: 'video' },
  { label: 'Story', value: 'story' },
] as const
export const SOCIAL_SOURCES = [
  { label: 'Published from LankaNewHomes', value: 'published_by_us' },
  { label: 'Imported from Instagram / Facebook', value: 'imported' },
  { label: 'Added by link', value: 'manual' },
] as const
export const SOCIAL_STATUSES = [
  { label: 'Published', value: 'published' },
  { label: 'Processing', value: 'processing' },
  { label: 'Failed', value: 'failed' },
  { label: 'Dry run', value: 'dry_run' },
  { label: 'Scheduled', value: 'scheduled' },
] as const

export const SocialPosts: CollectionConfig = {
  slug: 'social-posts',
  admin: {
    group: 'Marketing',
    useAsTitle: 'id',
    defaultColumns: ['project', 'platform', 'kind', 'status', 'permalink', 'postedAt'],
    hidden: hiddenUnlessAdmin,
  },
  // Admins see everything; a developer sees the posts about listings they manage (the unmatched ones stay admin-only).
  access: { read: projectContentRead, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    // Not required: imported posts that name no listing are kept here for an admin to assign.
    { name: 'project', type: 'relationship', relationTo: 'projects', index: true },
    // Set for posts about a land listing instead of a project; /links/land is built from these.
    { name: 'land', type: 'relationship', relationTo: 'lands', index: true, admin: { description: 'The land listing this post is about (leave empty for project posts).' } },
    { name: 'platform', type: 'select', options: [...SOCIAL_PLATFORMS], required: true },
    { name: 'kind', type: 'select', options: [...SOCIAL_KINDS], required: true },
    { name: 'status', type: 'select', options: [...SOCIAL_STATUSES], required: true, admin: { components: { Cell: '@/components/payload/ListingCells#StatusCell' } } },
    { name: 'externalId', type: 'text', index: true, admin: { description: 'Post / video / media id on Meta.' } },
    { name: 'source', type: 'select', options: [...SOCIAL_SOURCES], defaultValue: 'published_by_us', index: true },
    { name: 'matchedBy', type: 'text', admin: { description: 'How the listing was found: link, name or hashtag in the caption.' } },
    { name: 'mediaUrl', type: 'text' },
    { name: 'thumbnailUrl', type: 'text' },
    { name: 'likes', type: 'number' },
    { name: 'comments', type: 'number' },
    { name: 'creationId', type: 'text', admin: { description: 'Instagram container id (until published).' } },
    { name: 'permalink', type: 'text' },
    { name: 'caption', type: 'textarea' },
    { name: 'error', type: 'text' },
    { name: 'triggeredBy', type: 'text', admin: { description: 'User email, or "auto-post".' } },
    { name: 'details', type: 'json', admin: { description: 'Media URLs sent (dry runs keep the whole would-be request here).' } },
    { name: 'scheduledFor', type: 'date', admin: { description: 'When a scheduled post goes out (checked every 5 minutes).', date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'postedAt', type: 'date', admin: { components: { Cell: '@/components/payload/ListingCells#DateCell' } } },
  ],
}

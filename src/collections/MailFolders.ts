import type { CollectionConfig } from 'payload'
import { adminOnly, hiddenUnlessAdmin } from './access'

export const MailFolders: CollectionConfig = {
  slug: 'mail-folders',
  labels: { singular: 'Mail folder', plural: 'Mail folders' },
  admin: { group: 'Mail', useAsTitle: 'name', defaultColumns: ['account', 'name', 'type', 'unreadCount', 'totalCount'], hidden: hiddenUnlessAdmin },
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'account', type: 'relationship', relationTo: 'mail-accounts', required: true, index: true },
    { name: 'zohoFolderId', type: 'text', required: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'type', type: 'select', required: true, defaultValue: 'custom', options: ['inbox', 'sent', 'drafts', 'spam', 'trash', 'archive', 'custom'] },
    { name: 'unreadCount', type: 'number', defaultValue: 0 },
    { name: 'totalCount', type: 'number', defaultValue: 0 },
  ],
}

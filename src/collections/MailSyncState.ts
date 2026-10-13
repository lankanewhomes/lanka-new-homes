import type { CollectionConfig } from 'payload'
import { adminOnly, hiddenUnlessAdmin } from './access'

// One row per mailbox + folder (and one per mailbox with no folder = the account-level lock/last run). Lets the full import
// resume where it stopped and the incremental sync avoid re-fetching everything.
export const MailSyncState: CollectionConfig = {
  slug: 'mail-sync-state',
  labels: { singular: 'Mail sync state', plural: 'Mail sync state' },
  admin: { group: 'Mail', useAsTitle: 'zohoFolderId', defaultColumns: ['account', 'zohoFolderId', 'importStatus', 'importedCount', 'totalCount', 'lastSyncedAt'], hidden: hiddenUnlessAdmin },
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'account', type: 'relationship', relationTo: 'mail-accounts', required: true, index: true },
    { name: 'folder', type: 'relationship', relationTo: 'mail-folders', index: true },
    { name: 'zohoFolderId', type: 'text', index: true, admin: { description: 'Empty on the account-level row.' } },
    { name: 'importStatus', type: 'select', defaultValue: 'pending', options: ['pending', 'running', 'complete', 'error'] },
    { name: 'importOffset', type: 'number', defaultValue: 0, admin: { description: 'Where the full import resumes (messages already imported, newest first).' } },
    { name: 'importedCount', type: 'number', defaultValue: 0 },
    { name: 'totalCount', type: 'number', defaultValue: 0 },
    { name: 'reconcileOffset', type: 'number', defaultValue: 0, admin: { description: 'Rotating window used to spot older changes and deletions.' } },
    { name: 'lastMessageAt', type: 'date', admin: { description: 'Newest message seen in this folder.' } },
    { name: 'lastSyncedAt', type: 'date' },
    { name: 'lockedUntil', type: 'date', admin: { description: 'Account-level row: another sync is running until this time.' } },
    { name: 'lastError', type: 'text' },
  ],
}

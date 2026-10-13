import type { CollectionConfig } from 'payload'
import { adminOnly, hiddenUnlessAdmin } from './access'

// Local cache of Zoho mail. Zoho is the source of truth: the sync (src/lib/mail/sync.ts) overwrites these rows from Zoho, and
// actions made in the CMS are sent to Zoho first. Metadata is imported in bulk; htmlBody is fetched when a message is opened.
export const MailMessages: CollectionConfig = {
  slug: 'mail-messages',
  labels: { singular: 'Mail message', plural: 'Mail messages' },
  defaultSort: '-receivedAt',
  admin: { group: 'Mail', useAsTitle: 'subject', defaultColumns: ['subject', 'fromEmail', 'account', 'isRead', 'receivedAt'], hidden: hiddenUnlessAdmin },
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'messageKey', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true, description: '<zohoAccountId>:<zohoMessageId>, so one Zoho message is one row.' } },
    { name: 'account', type: 'relationship', relationTo: 'mail-accounts', required: true, index: true },
    { name: 'folder', type: 'relationship', relationTo: 'mail-folders', required: true, index: true },
    { name: 'zohoMessageId', type: 'text', required: true, index: true },
    { name: 'threadId', type: 'text', index: true },
    { name: 'fromName', type: 'text' },
    { name: 'fromEmail', type: 'text', index: true },
    { name: 'toAddresses', type: 'json' },
    { name: 'ccAddresses', type: 'json' },
    { name: 'bccAddresses', type: 'json' },
    { name: 'subject', type: 'text' },
    { name: 'snippet', type: 'text' },
    { name: 'htmlBody', type: 'textarea', admin: { description: 'Fetched when the message is first opened, then cached.' } },
    { name: 'bodyFetchedAt', type: 'date' },
    { name: 'hasAttachments', type: 'checkbox', defaultValue: false },
    { name: 'attachments', type: 'json' },
    { name: 'isRead', type: 'checkbox', defaultValue: false, index: true },
    { name: 'isStarred', type: 'checkbox', defaultValue: false, index: true },
    { name: 'receivedAt', type: 'date', index: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'labels', type: 'json' },
  ],
}

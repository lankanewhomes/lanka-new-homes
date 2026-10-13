import type { CollectionConfig } from 'payload'
import { adminOnly, hiddenUnlessAdmin } from './access'

// Mailboxes connected to the CMS mail client (/cms/mail). Filled in automatically from Zoho (accountId, name); the signature
// and colour are editable. The Zoho refresh token lives in env (ZOHO_REFRESH_TOKEN), never here.
export const MailAccounts: CollectionConfig = {
  slug: 'mail-accounts',
  labels: { singular: 'Mailbox', plural: 'Mailboxes' },
  admin: {
    group: 'Mail',
    useAsTitle: 'email',
    defaultColumns: ['email', 'displayName', 'zohoAccountId', 'active'],
    hidden: hiddenUnlessAdmin,
    description: 'The Zoho mailboxes shown in the CMS mail client. Open the client at /cms/mail.',
  },
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true, index: true },
    { name: 'displayName', type: 'text' },
    { name: 'zohoAccountId', type: 'text', admin: { readOnly: true, description: 'Filled in automatically from Zoho.' } },
    { name: 'source', type: 'text', admin: { readOnly: true, description: 'mock or zoho: which provider filled the cached mail.' } },
    { name: 'signature', type: 'textarea', admin: { description: 'HTML signature added to new messages sent from this mailbox.' } },
    { name: 'color', type: 'text', defaultValue: '#2563eb', admin: { description: 'Tag colour in the message list, e.g. #2563eb.' } },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}

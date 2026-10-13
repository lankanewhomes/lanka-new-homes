// Shared types and the provider interface for the CMS mail client (/cms/mail).
// The mock client (mock-client.ts) and the real Zoho client (zoho-client.ts) both implement MailProvider, so switching from
// mock to live is only MAIL_MOCK_MODE=false. Everything uses HTTP/fetch, so it runs on Vercel and on Cloudflare Workers.

export type MailFolderType = 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash' | 'archive' | 'custom'

export type MailAddress = { name?: string; email: string }

export type ProviderAccount = { zohoAccountId: string; email: string; displayName: string }

export type ProviderFolder = {
  zohoFolderId: string
  name: string
  type: MailFolderType
  unreadCount: number
  totalCount: number
}

export type ProviderAttachmentMeta = { id: string; filename: string; contentType: string; size: number }

export type ProviderMessageSummary = {
  zohoMessageId: string
  zohoFolderId: string
  threadId: string
  from: MailAddress
  to: MailAddress[]
  cc: MailAddress[]
  bcc: MailAddress[]
  subject: string
  snippet: string
  hasAttachments: boolean
  isRead: boolean
  isStarred: boolean
  /** ISO timestamp */
  receivedAt: string
}

export type ProviderMessageFull = ProviderMessageSummary & {
  htmlBody: string
  textBody?: string
  attachments: ProviderAttachmentMeta[]
}

export type ListMessagesParams = {
  /** 0-based offset into the folder, newest first. */
  offset: number
  limit: number
}

export type ListMessagesPage = {
  messages: ProviderMessageSummary[]
  /** Total messages in the folder when the provider reports it. */
  total?: number
  hasMore: boolean
}

export type OutgoingAttachment = { filename: string; contentType: string; /** base64 */ contentBase64: string }

export type OutgoingMessage = {
  from: string
  to: MailAddress[]
  cc?: MailAddress[]
  bcc?: MailAddress[]
  subject: string
  htmlBody: string
  attachments?: OutgoingAttachment[]
  /** Set for reply / reply-all / forward. */
  inReplyTo?: { zohoFolderId: string; zohoMessageId: string; mode: 'reply' | 'replyAll' | 'forward' }
}

export type MessageAction =
  | { type: 'markRead' }
  | { type: 'markUnread' }
  | { type: 'star' }
  | { type: 'unstar' }
  | { type: 'move'; destFolderId: string }
  | { type: 'archive' }
  | { type: 'spam' }

export type ProviderAttachmentFile = { filename: string; contentType: string; bytes: Uint8Array }

export interface MailProvider {
  readonly mode: 'mock' | 'zoho'
  testConnection(): Promise<{ ok: boolean; message: string; accounts: ProviderAccount[] }>
  listAccounts(): Promise<ProviderAccount[]>
  listFolders(zohoAccountId: string): Promise<ProviderFolder[]>
  listMessages(zohoAccountId: string, zohoFolderId: string, params: ListMessagesParams): Promise<ListMessagesPage>
  getMessage(zohoAccountId: string, zohoFolderId: string, zohoMessageId: string): Promise<ProviderMessageFull | null>
  sendMessage(zohoAccountId: string, message: OutgoingMessage): Promise<{ zohoMessageId?: string }>
  saveDraft(zohoAccountId: string, message: OutgoingMessage, existingDraftId?: string): Promise<{ zohoMessageId: string }>
  updateMessages(zohoAccountId: string, zohoFolderId: string, zohoMessageIds: string[], action: MessageAction): Promise<void>
  deleteMessages(zohoAccountId: string, zohoFolderId: string, zohoMessageIds: string[]): Promise<void>
  getAttachment(zohoAccountId: string, zohoFolderId: string, zohoMessageId: string, attachmentId: string): Promise<ProviderAttachmentFile>
}

export const FOLDER_TYPE_ORDER: MailFolderType[] = ['inbox', 'sent', 'drafts', 'archive', 'spam', 'trash', 'custom']

export function plainSnippet(html: string, max = 140): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

export function formatAddress(a: MailAddress): string {
  return a.name ? `${a.name} <${a.email}>` : a.email
}

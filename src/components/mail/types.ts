export type MailAddress = { name?: string; email: string }
export type FolderType = 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash' | 'archive' | 'custom'

export type Folder = { id: number; zohoFolderId: string; name: string; type: FolderType; unread: number; total: number }
export type Account = { id: number; email: string; displayName: string; color: string; signature: string; zohoAccountId: string; folders: Folder[] }

export type Attachment = { id: string; filename: string; contentType: string; size: number }

export type MailMessage = {
  id: number
  accountId: number
  folderId: number
  folderType: FolderType
  zohoMessageId: string
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
  receivedAt: string | null
  htmlBody?: string
  attachments?: Attachment[]
  accountEmail?: string
}

export type View =
  | { kind: 'all-inbox' }
  | { kind: 'starred'; accountId?: number }
  | { kind: 'folder'; accountId: number; folderId: number }

export type Filters = {
  q: string
  from: string
  to: string
  subject: string
  hasAttachment: boolean
  unread: boolean
  accountId: number | null
  dateFrom: string
  dateTo: string
}

export const EMPTY_FILTERS: Filters = { q: '', from: '', to: '', subject: '', hasAttachment: false, unread: false, accountId: null, dateFrom: '', dateTo: '' }

export type ComposeInit = {
  accountId: number
  to: MailAddress[]
  cc: MailAddress[]
  bcc: MailAddress[]
  subject: string
  /** Body below the signature (a quoted reply / forward). */
  quoteHtml?: string
  /** A saved draft's own body (replaces signature + quote). */
  draftHtml?: string
  inReplyToId?: number
  replyMode?: 'reply' | 'replyAll' | 'forward'
  draftId?: number
}

export type MailAction =
  | { type: 'markRead' }
  | { type: 'markUnread' }
  | { type: 'star' }
  | { type: 'unstar' }
  | { type: 'move'; destFolderId: string }
  | { type: 'archive' }
  | { type: 'spam' }

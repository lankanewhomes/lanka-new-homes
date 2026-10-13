import { MOCK_ACCOUNTS, MOCK_MESSAGES, mockFolderSeeds } from './mock-data'
import {
  plainSnippet,
  type ListMessagesPage,
  type ListMessagesParams,
  type MailProvider,
  type MessageAction,
  type OutgoingMessage,
  type ProviderAccount,
  type ProviderAttachmentFile,
  type ProviderFolder,
  type ProviderMessageFull,
} from './types'

// In-memory Zoho stand-in. State lives on globalThis so it survives hot reloads, and every action (send, move, delete, star…)
// really changes it, so the whole UI and the two-way sync can be exercised without any API credentials.

type StoredMessage = ProviderMessageFull & { attachmentBytes: Record<string, string> }
type MockStore = { folders: Map<string, ProviderFolder[]>; messages: Map<string, StoredMessage[]>; counter: number }

const KEY = Symbol.for('lnh.mail.mockStore')

function buildStore(): MockStore {
  const store: MockStore = { folders: new Map(), messages: new Map(), counter: 1 }
  for (const account of MOCK_ACCOUNTS) {
    const seeds = mockFolderSeeds(account.zohoAccountId)
    store.folders.set(account.zohoAccountId, seeds.map((f) => ({ zohoFolderId: f.id, name: f.name, type: f.type, unreadCount: 0, totalCount: 0 })))
    store.messages.set(account.zohoAccountId, [])
  }
  const now = Date.now()
  for (const seed of MOCK_MESSAGES) {
    const folderId = `${seed.accountId}-${seed.folder}`
    const id = `${seed.accountId}-m${store.counter++}`
    const attachments = (seed.attachments ?? []).map((a, i) => ({ id: `${id}-a${i}`, ...a }))
    store.messages.get(seed.accountId)!.push({
      zohoMessageId: id, zohoFolderId: folderId, threadId: `${seed.accountId}-${seed.threadKey}`, from: seed.from, to: seed.to, cc: seed.cc ?? [], bcc: [],
      subject: seed.subject, snippet: plainSnippet(seed.html), hasAttachments: attachments.length > 0, isRead: seed.read ?? true, isStarred: seed.starred ?? false,
      receivedAt: new Date(now - seed.minutesAgo * 60_000).toISOString(), htmlBody: seed.html, textBody: plainSnippet(seed.html, 5000), attachments,
      attachmentBytes: Object.fromEntries(attachments.map((a) => [a.id, `Sample attachment ${a.filename} (mock mode)`])),
    })
  }
  return store
}

function store(): MockStore {
  const g = globalThis as unknown as Record<symbol, MockStore | undefined>
  return (g[KEY] ??= buildStore())
}

const sorted = (list: StoredMessage[]) => [...list].sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1))
const strip = ({ attachmentBytes: _b, ...rest }: StoredMessage): ProviderMessageFull => rest
const summary = ({ htmlBody: _h, textBody: _t, attachments: _a, attachmentBytes: _b, ...rest }: StoredMessage) => rest

function folderOf(accountId: string, type: string): string {
  return store().folders.get(accountId)!.find((f) => f.type === type)!.zohoFolderId
}

export class MockMailProvider implements MailProvider {
  readonly mode = 'mock' as const

  async testConnection() {
    return { ok: true, message: 'Mock mode: sample data, not connected to Zoho.', accounts: await this.listAccounts() }
  }

  async listAccounts(): Promise<ProviderAccount[]> {
    return MOCK_ACCOUNTS.map((a) => ({ ...a }))
  }

  async listFolders(accountId: string): Promise<ProviderFolder[]> {
    const s = store()
    const msgs = s.messages.get(accountId) ?? []
    return (s.folders.get(accountId) ?? []).map((f) => {
      const inFolder = msgs.filter((m) => m.zohoFolderId === f.zohoFolderId)
      return { ...f, totalCount: inFolder.length, unreadCount: inFolder.filter((m) => !m.isRead).length }
    })
  }

  async listMessages(accountId: string, folderId: string, { offset, limit }: ListMessagesParams): Promise<ListMessagesPage> {
    const all = sorted((store().messages.get(accountId) ?? []).filter((m) => m.zohoFolderId === folderId))
    const page = all.slice(offset, offset + limit).map(summary)
    return { messages: page, total: all.length, hasMore: offset + limit < all.length }
  }

  async getMessage(accountId: string, folderId: string, messageId: string) {
    const m = (store().messages.get(accountId) ?? []).find((x) => x.zohoMessageId === messageId && x.zohoFolderId === folderId)
    return m ? strip(m) : null
  }

  async sendMessage(accountId: string, message: OutgoingMessage) {
    const s = store()
    const id = `${accountId}-m${s.counter++}`
    const account = MOCK_ACCOUNTS.find((a) => a.zohoAccountId === accountId)!
    const parent = message.inReplyTo ? s.messages.get(accountId)!.find((m) => m.zohoMessageId === message.inReplyTo!.zohoMessageId) : undefined
    s.messages.get(accountId)!.push({
      zohoMessageId: id, zohoFolderId: folderOf(accountId, 'sent'), threadId: parent?.threadId ?? `${accountId}-t-${id}`,
      from: { name: account.displayName, email: message.from }, to: message.to, cc: message.cc ?? [], bcc: message.bcc ?? [], subject: message.subject,
      snippet: plainSnippet(message.htmlBody), hasAttachments: Boolean(message.attachments?.length), isRead: true, isStarred: false, receivedAt: new Date().toISOString(),
      htmlBody: message.htmlBody, textBody: plainSnippet(message.htmlBody, 5000),
      attachments: (message.attachments ?? []).map((a, i) => ({ id: `${id}-a${i}`, filename: a.filename, contentType: a.contentType, size: Math.round((a.contentBase64.length * 3) / 4) })),
      attachmentBytes: Object.fromEntries((message.attachments ?? []).map((a, i) => [`${id}-a${i}`, Buffer.from(a.contentBase64, 'base64').toString('binary')])),
    })
    return { zohoMessageId: id }
  }

  async saveDraft(accountId: string, message: OutgoingMessage, existingDraftId?: string) {
    const s = store()
    const list = s.messages.get(accountId)!
    const draftsFolder = folderOf(accountId, 'drafts')
    const existing = existingDraftId ? list.find((m) => m.zohoMessageId === existingDraftId) : undefined
    const id = existing?.zohoMessageId ?? `${accountId}-m${s.counter++}`
    const account = MOCK_ACCOUNTS.find((a) => a.zohoAccountId === accountId)!
    const next: StoredMessage = {
      zohoMessageId: id, zohoFolderId: draftsFolder, threadId: existing?.threadId ?? `${accountId}-t-${id}`, from: { name: account.displayName, email: message.from }, to: message.to,
      cc: message.cc ?? [], bcc: message.bcc ?? [], subject: message.subject || '(no subject)', snippet: plainSnippet(message.htmlBody), hasAttachments: Boolean(message.attachments?.length),
      isRead: true, isStarred: false, receivedAt: new Date().toISOString(), htmlBody: message.htmlBody, textBody: plainSnippet(message.htmlBody, 5000), attachments: [], attachmentBytes: {},
    }
    if (existing) list[list.indexOf(existing)] = next
    else list.push(next)
    return { zohoMessageId: id }
  }

  async updateMessages(accountId: string, folderId: string, ids: string[], action: MessageAction) {
    const list = store().messages.get(accountId) ?? []
    for (const m of list) {
      if (!ids.includes(m.zohoMessageId) || m.zohoFolderId !== folderId) continue
      if (action.type === 'markRead') m.isRead = true
      else if (action.type === 'markUnread') m.isRead = false
      else if (action.type === 'star') m.isStarred = true
      else if (action.type === 'unstar') m.isStarred = false
      else if (action.type === 'move') m.zohoFolderId = action.destFolderId
      else if (action.type === 'archive') m.zohoFolderId = folderOf(accountId, 'archive')
      else if (action.type === 'spam') m.zohoFolderId = folderOf(accountId, 'spam')
    }
  }

  async deleteMessages(accountId: string, folderId: string, ids: string[]) {
    const s = store()
    const list = s.messages.get(accountId) ?? []
    const trash = folderOf(accountId, 'trash')
    if (folderId === trash) {
      s.messages.set(accountId, list.filter((m) => !(ids.includes(m.zohoMessageId) && m.zohoFolderId === folderId)))
      return
    }
    for (const m of list) if (ids.includes(m.zohoMessageId) && m.zohoFolderId === folderId) m.zohoFolderId = trash
  }

  async getAttachment(accountId: string, folderId: string, messageId: string, attachmentId: string): Promise<ProviderAttachmentFile> {
    const m = (store().messages.get(accountId) ?? []).find((x) => x.zohoMessageId === messageId && x.zohoFolderId === folderId)
    const meta = m?.attachments.find((a) => a.id === attachmentId)
    if (!m || !meta) throw new Error('Attachment not found')
    return { filename: meta.filename, contentType: meta.contentType, bytes: new TextEncoder().encode(m.attachmentBytes[attachmentId] ?? '') }
  }

  /** Test helper: pretend a new mail arrived in Zoho (used to exercise the Zoho → CMS sync). */
  simulateIncoming(accountId: string, subject: string, fromEmail = 'someone@example.com') {
    const s = store()
    const id = `${accountId}-m${s.counter++}`
    s.messages.get(accountId)!.push({
      zohoMessageId: id, zohoFolderId: folderOf(accountId, 'inbox'), threadId: `${accountId}-t-${id}`, from: { email: fromEmail }, to: [{ email: MOCK_ACCOUNTS.find((a) => a.zohoAccountId === accountId)!.email }],
      cc: [], bcc: [], subject, snippet: subject, hasAttachments: false, isRead: false, isStarred: false, receivedAt: new Date().toISOString(), htmlBody: `<p>${subject}</p>`, textBody: subject, attachments: [], attachmentBytes: {},
    })
    return id
  }
}

// Google Workspace mail provider (Gmail API), the replacement for the Zoho client (owner, 2026-11-17: "I'm moving away from Zoho mail,
// I'm going to use Google Workspace"). It implements the same MailProvider interface, so the inbox, sync and send code do not change.
//
// Auth: ONE Google service account with domain-wide delegation. For each mailbox it signs a short-lived JWT with `sub` = that mailbox, so
// no per-mailbox login or refresh token is needed. Everything is fetch + Web Crypto, so it runs on Cloudflare Workers and Node alike.
//
//   GOOGLE_MAIL_SA_EMAIL = service account client_email
//   GOOGLE_MAIL_SA_KEY   = service account private_key (the PEM; literal "\n" sequences are accepted)
//   Admin console: Security > API controls > Domain-wide delegation, scope https://mail.google.com/
//   One real mailbox (GOOGLE_MAIL_PRIMARY, default rupan@lankanewhomes.com); support@, developers@ and no-reply@ are its aliases. To keep an
//   alias in From, register them once with scripts/google-register-aliases.mts (needs the gmail.settings.sharing scope).
//
// Mapping onto the Zoho-shaped interface (the field names keep "zoho" so sync.ts and the collections stay untouched):
//   zohoAccountId = the mailbox address   zohoFolderId = Gmail label id (INBOX, SENT, DRAFT, SPAM, TRASH, or a user label id)
//   zohoMessageId = Gmail message id      "ARCHIVE" is a virtual folder: mail with no inbox, sent, draft, spam or trash label ("All Mail").

import { senderHeader } from '../sender-names'
import type {
  ListMessagesPage, ListMessagesParams, MailAddress, MailFolderType, MailProvider, MessageAction, OutgoingMessage, ProviderAccount,
  ProviderAttachmentFile, ProviderAttachmentMeta, ProviderFolder, ProviderMessageFull, ProviderMessageSummary,
} from './types'
import { aliasesFor, configuredMailboxes } from './index'

const SCOPE = 'https://mail.google.com/'
const API = 'https://gmail.googleapis.com/gmail/v1/users/me'
const ARCHIVE_ID = 'ARCHIVE'
const ARCHIVE_QUERY = '-in:inbox -in:sent -in:drafts -in:spam -in:trash'
const SYSTEM: { id: string; name: string; type: MailFolderType }[] = [
  { id: 'INBOX', name: 'Inbox', type: 'inbox' },
  { id: 'SENT', name: 'Sent', type: 'sent' },
  { id: 'DRAFT', name: 'Drafts', type: 'drafts' },
  { id: ARCHIVE_ID, name: 'All mail', type: 'archive' },
  { id: 'SPAM', name: 'Spam', type: 'spam' },
  { id: 'TRASH', name: 'Trash', type: 'trash' },
]

type Json = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

export function googleCredentialsPresent(): boolean {
  return Boolean(process.env.GOOGLE_MAIL_SA_EMAIL && process.env.GOOGLE_MAIL_SA_KEY)
}

// ---- small encoding helpers (no Buffer, so Workers need no polyfill)
const enc = new TextEncoder()
const toBase64 = (bytes: Uint8Array): string => {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}
const toBase64Url = (bytes: Uint8Array): string => toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromBase64Url = (data: string): Uint8Array => {
  const bin = atob(data.replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
const decodeText = (data: string | undefined): string => (data ? new TextDecoder().decode(fromBase64Url(data)) : '')
const wrap76 = (b64: string): string => b64.replace(/(.{76})/g, '$1\r\n')
const mimeWord = (text: string): string => (/^[\x20-\x7e]*$/.test(text) ? text : `=?UTF-8?B?${toBase64(enc.encode(text))}?=`)
const addressHeader = (list: MailAddress[]): string => list.map((a) => (a.name ? `${mimeWord(a.name.replace(/["\\]/g, ''))} <${a.email}>` : a.email)).join(', ')

/** "Name <a@b.c>, d@e.f" into addresses (quoted names and commas inside quotes are handled). */
export function parseAddressList(value: string | undefined): MailAddress[] {
  if (!value) return []
  const parts: string[] = []
  let cur = ''
  let quoted = false
  for (const ch of value) {
    if (ch === '"') quoted = !quoted
    if (ch === ',' && !quoted) { parts.push(cur); cur = '' } else cur += ch
  }
  parts.push(cur)
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const m = p.match(/^(.*?)\s*<([^>]+)>$/)
      return m ? { name: m[1].replace(/^"|"$/g, '').trim() || undefined, email: m[2].trim() } : { email: p.replace(/^<|>$/g, '') }
    })
}

const header = (msg: Json, name: string): string => (msg.payload?.headers ?? []).find((h: Json) => String(h.name).toLowerCase() === name.toLowerCase())?.value ?? ''

function pemToDer(pem: string): ArrayBuffer {
  const body = pem.replace(/\\n/g, '\n').replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '')
  const bin = atob(body)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out.buffer
}

type TokenEntry = { token: string; expires: number }
const tokenCache = new Map<string, TokenEntry>()

async function accessToken(mailbox: string): Promise<string> {
  const hit = tokenCache.get(mailbox)
  if (hit && hit.expires > Date.now() + 60_000) return hit.token
  const email = process.env.GOOGLE_MAIL_SA_EMAIL ?? ''
  const key = process.env.GOOGLE_MAIL_SA_KEY ?? ''
  if (!email || !key) throw new Error('Google mail is not configured: set GOOGLE_MAIL_SA_EMAIL and GOOGLE_MAIL_SA_KEY.')
  const now = Math.floor(Date.now() / 1000)
  const part = (o: object) => toBase64Url(enc.encode(JSON.stringify(o)))
  const unsigned = `${part({ alg: 'RS256', typ: 'JWT' })}.${part({ iss: email, sub: mailbox, scope: SCOPE, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`
  const cryptoKey = await crypto.subtle.importKey('pkcs8', pemToDer(key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, enc.encode(unsigned)))
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${toBase64Url(signature)}` }),
  })
  const data = (await res.json().catch(() => ({}))) as Json
  if (!res.ok || !data.access_token) throw new Error(`Google sign-in failed for ${mailbox} (${res.status}): ${data.error_description ?? data.error ?? 'unknown error'}. Check the domain-wide delegation scope.`)
  tokenCache.set(mailbox, { token: data.access_token, expires: Date.now() + (Number(data.expires_in) || 3600) * 1000 })
  return data.access_token
}

async function gmail(mailbox: string, method: string, path: string, opts: { query?: Record<string, string | number | string[] | undefined>; json?: unknown; binary?: boolean } = {}): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const url = new URL(`${API}${path}`)
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v === undefined) continue
    for (const one of Array.isArray(v) ? v : [v]) url.searchParams.append(k, String(one))
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      method,
      headers: { authorization: `Bearer ${await accessToken(mailbox)}`, ...(opts.json ? { 'content-type': 'application/json' } : {}) },
      body: opts.json ? JSON.stringify(opts.json) : undefined,
    })
    if (res.status === 401) { tokenCache.delete(mailbox); continue }
    if ((res.status === 429 || res.status >= 500) && attempt < 2) { await new Promise((r) => setTimeout(r, 600 * (attempt + 1))); continue }
    if (res.status === 204) return {}
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as Json
      throw new Error(`Gmail ${method} ${path} failed (${res.status}): ${body.error?.message ?? 'unknown error'}`)
    }
    return opts.binary ? res.arrayBuffer() : res.json()
  }
  throw new Error(`Gmail ${method} ${path} failed after retries.`)
}

/** Message body parts: the first html (or text) body and the attachments. */
function walk(part: Json | undefined, out: { html: string; text: string; attachments: ProviderAttachmentMeta[] }) {
  if (!part) return
  const type = String(part.mimeType ?? '')
  if (part.filename && part.body?.attachmentId) {
    out.attachments.push({ id: String(part.body.attachmentId), filename: String(part.filename), contentType: type, size: Number(part.body.size) || 0 })
  } else if (type === 'text/html' && !out.html) out.html = decodeText(part.body?.data)
  else if (type === 'text/plain' && !out.text) out.text = decodeText(part.body?.data)
  for (const child of part.parts ?? []) walk(child, out)
}

function folderOf(labels: string[]): string {
  for (const id of ['TRASH', 'SPAM', 'DRAFT', 'INBOX', 'SENT']) if (labels.includes(id)) return id
  return ARCHIVE_ID
}

function summary(msg: Json, folderId?: string): ProviderMessageSummary {
  const labels: string[] = msg.labelIds ?? []
  return {
    zohoMessageId: String(msg.id),
    zohoFolderId: folderId ?? folderOf(labels),
    threadId: String(msg.threadId ?? msg.id),
    from: parseAddressList(header(msg, 'From'))[0] ?? { email: '' },
    to: parseAddressList(header(msg, 'To')),
    cc: parseAddressList(header(msg, 'Cc')),
    bcc: parseAddressList(header(msg, 'Bcc')),
    subject: header(msg, 'Subject'),
    snippet: String(msg.snippet ?? '').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
    hasAttachments: false,
    isRead: !labels.includes('UNREAD'),
    isStarred: labels.includes('STARRED'),
    receivedAt: new Date(Number(msg.internalDate) || Date.now()).toISOString(),
  }
}

function buildMime(message: OutgoingMessage, extra: { inReplyTo?: string; references?: string } = {}): string {
  const boundary = `lnh_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  const lines = [
    `From: ${senderHeader(message.from)}`,
    `To: ${addressHeader(message.to)}`,
    ...(message.cc?.length ? [`Cc: ${addressHeader(message.cc)}`] : []),
    ...(message.bcc?.length ? [`Bcc: ${addressHeader(message.bcc)}`] : []),
    `Subject: ${mimeWord(message.subject)}`,
    ...(extra.inReplyTo ? [`In-Reply-To: ${extra.inReplyTo}`, `References: ${extra.references ?? extra.inReplyTo}`] : []),
    'MIME-Version: 1.0',
  ]
  const htmlPart = ['Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrap76(toBase64(enc.encode(message.htmlBody)))]
  if (!message.attachments?.length) return [...lines, ...htmlPart].join('\r\n')
  const parts = [
    `--${boundary}`, ...htmlPart,
    ...message.attachments.flatMap((a) => [
      `--${boundary}`,
      `Content-Type: ${a.contentType || 'application/octet-stream'}; name="${mimeWord(a.filename)}"`,
      `Content-Disposition: attachment; filename="${mimeWord(a.filename)}"`,
      'Content-Transfer-Encoding: base64', '', wrap76(a.contentBase64),
    ]),
    `--${boundary}--`,
  ]
  return [...lines, `Content-Type: multipart/mixed; boundary="${boundary}"`, '', ...parts].join('\r\n')
}

async function inBatches<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = []
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(fn))))
  return out
}

export class GmailMailProvider implements MailProvider {
  readonly mode = 'google' as const

  async listAccounts(): Promise<ProviderAccount[]> {
    return configuredMailboxes().map((email) => ({ zohoAccountId: email, email, displayName: 'LankaNewHomes', aliases: aliasesFor(email) }))
  }

  async testConnection() {
    const accounts = await this.listAccounts()
    const failures: string[] = []
    for (const a of accounts) {
      try { await gmail(a.email, 'GET', '/profile') } catch (e) { failures.push(`${a.email}: ${e instanceof Error ? e.message : 'failed'}`) }
    }
    return failures.length
      ? { ok: false, message: failures.join(' | '), accounts }
      : { ok: true, message: `Connected to Google Workspace (${accounts.length} mailboxes).`, accounts }
  }

  async listFolders(mailbox: string): Promise<ProviderFolder[]> {
    const { labels = [] } = (await gmail(mailbox, 'GET', '/labels')) as { labels?: Json[] }
    const custom = labels.filter((l) => l.type === 'user')
    const wanted = [...SYSTEM.filter((s) => s.id !== ARCHIVE_ID).map((s) => s.id), ...custom.map((l) => String(l.id))]
    const detail = new Map<string, Json>()
    for (const l of await inBatches(wanted, 8, (id) => gmail(mailbox, 'GET', `/labels/${encodeURIComponent(id)}`).catch(() => ({ id })))) detail.set(String(l.id), l)
    const count = (id: string, key: string) => Number(detail.get(id)?.[key]) || 0
    return [
      ...SYSTEM.map((s) => ({
        zohoFolderId: s.id, name: s.name, type: s.type,
        unreadCount: s.id === ARCHIVE_ID ? 0 : s.id === 'DRAFT' ? 0 : count(s.id, 'messagesUnread'),
        totalCount: s.id === ARCHIVE_ID ? 0 : s.id === 'DRAFT' ? count(s.id, 'messagesTotal') : count(s.id, 'messagesTotal'),
      })),
      ...custom.map((l) => ({ zohoFolderId: String(l.id), name: String(l.name), type: 'custom' as MailFolderType, unreadCount: count(String(l.id), 'messagesUnread'), totalCount: count(String(l.id), 'messagesTotal') })),
    ]
  }

  async listMessages(mailbox: string, folderId: string, { offset, limit }: ListMessagesParams): Promise<ListMessagesPage> {
    const base = folderId === ARCHIVE_ID ? { q: ARCHIVE_QUERY } : { labelIds: [folderId] }
    // Gmail pages by token, not offset: walk the pages up to offset + limit, then read the slice.
    const ids: string[] = []
    let token: string | undefined
    let more = false
    do {
      const page = (await gmail(mailbox, 'GET', '/messages', { query: { ...base, maxResults: Math.min(500, offset + limit + 1 - ids.length), pageToken: token, includeSpamTrash: folderId === 'SPAM' || folderId === 'TRASH' ? 'true' : undefined } })) as Json
      ids.push(...(page.messages ?? []).map((m: Json) => String(m.id)))
      token = page.nextPageToken
      more = Boolean(token)
    } while (token && ids.length < offset + limit + 1)
    const slice = ids.slice(offset, offset + limit)
    const metas = await inBatches(slice, 10, (id) => gmail(mailbox, 'GET', `/messages/${id}`, { query: { format: 'metadata', metadataHeaders: ['From', 'To', 'Cc', 'Subject'] } }))
    const messages = metas.map((m) => summary(m, folderId))
    return { messages, hasMore: ids.length > offset + limit || (more && ids.length >= offset + limit) }
  }

  async getMessage(mailbox: string, folderId: string, messageId: string): Promise<ProviderMessageFull | null> {
    let msg: Json
    try { msg = await gmail(mailbox, 'GET', `/messages/${messageId}`, { query: { format: 'full' } }) } catch (e) {
      if (e instanceof Error && /\(404\)/.test(e.message)) return null
      throw e
    }
    const parts = { html: '', text: '', attachments: [] as ProviderAttachmentMeta[] }
    walk(msg.payload, parts)
    const base = summary(msg, folderId)
    const escaped = parts.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
    return { ...base, hasAttachments: parts.attachments.length > 0, htmlBody: parts.html || escaped, textBody: parts.text || undefined, attachments: parts.attachments }
  }

  async getAttachment(mailbox: string, _folderId: string, messageId: string, attachmentId: string): Promise<ProviderAttachmentFile> {
    const full = await this.getMessage(mailbox, _folderId, messageId)
    const meta = full?.attachments.find((a) => a.id === attachmentId)
    const data = (await gmail(mailbox, 'GET', `/messages/${messageId}/attachments/${encodeURIComponent(attachmentId)}`)) as Json
    return { filename: meta?.filename ?? 'attachment', contentType: meta?.contentType ?? 'application/octet-stream', bytes: fromBase64Url(String(data.data ?? '')) }
  }

  private async raw(mailbox: string, message: OutgoingMessage): Promise<{ raw: string; threadId?: string }> {
    const reply = message.inReplyTo
    let extra: { inReplyTo?: string; references?: string } = {}
    let threadId: string | undefined
    if (reply) {
      const orig = (await gmail(mailbox, 'GET', `/messages/${reply.zohoMessageId}`, { query: { format: 'metadata', metadataHeaders: ['Message-ID', 'References'] } }).catch(() => null)) as Json | null
      if (orig) {
        const id = header(orig, 'Message-ID')
        if (id && reply.mode !== 'forward') extra = { inReplyTo: id, references: `${header(orig, 'References')} ${id}`.trim() }
        if (reply.mode !== 'forward') threadId = String(orig.threadId)
      }
    }
    return { raw: toBase64Url(enc.encode(buildMime(message, extra))), threadId }
  }

  async sendMessage(mailbox: string, message: OutgoingMessage) {
    const { raw, threadId } = await this.raw(mailbox, message)
    const sent = (await gmail(mailbox, 'POST', '/messages/send', { json: { raw, ...(threadId ? { threadId } : {}) } })) as Json
    return { zohoMessageId: sent.id ? String(sent.id) : undefined }
  }

  async saveDraft(mailbox: string, message: OutgoingMessage, existingDraftId?: string) {
    const { raw, threadId } = await this.raw(mailbox, message)
    const body = { message: { raw, ...(threadId ? { threadId } : {}) } }
    // Drafts have their own ids; the app keeps the message id, so find the draft that holds it.
    if (existingDraftId) {
      const { drafts = [] } = (await gmail(mailbox, 'GET', '/drafts', { query: { maxResults: 100 } })) as { drafts?: Json[] }
      const draft = drafts.find((d) => String(d.message?.id) === existingDraftId)
      if (draft) {
        const updated = (await gmail(mailbox, 'PUT', `/drafts/${draft.id}`, { json: body })) as Json
        return { zohoMessageId: String(updated.message?.id ?? existingDraftId) }
      }
    }
    const created = (await gmail(mailbox, 'POST', '/drafts', { json: body })) as Json
    return { zohoMessageId: String(created.message?.id) }
  }

  async updateMessages(mailbox: string, folderId: string, ids: string[], action: MessageAction) {
    const add: string[] = []
    const remove: string[] = []
    switch (action.type) {
      case 'markRead': remove.push('UNREAD'); break
      case 'markUnread': add.push('UNREAD'); break
      case 'star': add.push('STARRED'); break
      case 'unstar': remove.push('STARRED'); break
      case 'archive': remove.push('INBOX'); break
      case 'spam': add.push('SPAM'); remove.push('INBOX'); break
      case 'move': {
        const dest = action.destFolderId
        if (dest === ARCHIVE_ID) remove.push('INBOX')
        else add.push(dest)
        if (folderId !== ARCHIVE_ID && folderId !== dest && folderId !== 'SENT' && folderId !== 'DRAFT') remove.push(folderId)
        break
      }
    }
    for (let i = 0; i < ids.length; i += 1000) {
      await gmail(mailbox, 'POST', '/messages/batchModify', { json: { ids: ids.slice(i, i + 1000), addLabelIds: add, removeLabelIds: remove } })
    }
  }

  async deleteMessages(mailbox: string, folderId: string, ids: string[]) {
    // Like a normal mail client: delete moves to Trash; deleting from Trash removes for good.
    if (folderId === 'TRASH') await gmail(mailbox, 'POST', '/messages/batchDelete', { json: { ids } })
    else await inBatches(ids, 8, (id) => gmail(mailbox, 'POST', `/messages/${id}/trash`))
  }
}

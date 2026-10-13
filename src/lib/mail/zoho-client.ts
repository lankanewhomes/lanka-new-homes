import { configuredMailboxes } from './index'
import {
  plainSnippet,
  type ListMessagesPage,
  type ListMessagesParams,
  type MailAddress,
  type MailFolderType,
  type MailProvider,
  type MessageAction,
  type OutgoingMessage,
  type ProviderAccount,
  type ProviderAttachmentFile,
  type ProviderFolder,
  type ProviderMessageFull,
  type ProviderMessageSummary,
} from './types'

// Real Zoho Mail REST client (OAuth 2.0 Self Client). HTTP/fetch only, so it runs on Vercel and Cloudflare Workers.
// Env: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_ACCOUNTS_URL (https://accounts.zoho.com | .eu | .in | https://accounts.zohocloud.ca ...),
// ZOHO_MAIL_API_URL (https://mail.zoho.com/api | https://mail.zoho.eu/api | https://mail.zohocloud.ca/api ...). Tokens stay on the server.
// Endpoint shapes follow https://www.zoho.com/mail/help/api/ : if Zoho rejects one of the update "modes" below, only the MODES table needs changing.

const MODES = {
  markRead: 'markAsRead',
  markUnread: 'markAsUnread',
  move: 'moveMessage',
  archive: 'archiveMessage',
  spam: 'markSpam',
  star: 'setFlag',
  unstar: 'removeFlag',
} as const
const STAR_FLAG = 'flag_important'

type Json = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any -- Zoho responses are loosely typed

const KEY = Symbol.for('lnh.zoho.token')
type TokenCache = { token: string; expiresAt: number; pending?: Promise<string> }

function env(name: string, fallback = ''): string {
  return (process.env[name] || fallback).replace(/\/$/, '')
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function decodeEntities(s: string): string {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
}

/** Zoho returns address lists as one string, often HTML-escaped: `"Name"&lt;a@b.com&gt;,c@d.com`. */
export function parseZohoAddresses(raw: unknown): MailAddress[] {
  if (typeof raw !== 'string' || !raw.trim()) return []
  const text = decodeEntities(raw)
  const parts: string[] = []
  let depth = 0
  let quote = false
  let cur = ''
  for (const ch of text) {
    if (ch === '"') quote = !quote
    if (ch === '<') depth += 1
    if (ch === '>') depth = Math.max(0, depth - 1)
    if ((ch === ',' || ch === ';') && !quote && depth === 0) { parts.push(cur); cur = '' } else cur += ch
  }
  parts.push(cur)
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const m = p.match(/^"?([^"<]*?)"?\s*<([^>]+)>$/)
      return m ? { name: m[1].trim() || undefined, email: m[2].trim() } : { email: p.replace(/^<|>$/g, '').trim() }
    })
    .filter((a) => a.email.includes('@'))
}

function folderType(name: string, zohoType: string): MailFolderType {
  const t = (zohoType || name).toLowerCase()
  if (t.includes('inbox')) return 'inbox'
  if (t.includes('sent')) return 'sent'
  if (t.includes('draft')) return 'drafts'
  if (t.includes('spam') || t.includes('junk')) return 'spam'
  if (t.includes('trash') || t.includes('deleted')) return 'trash'
  if (t.includes('archive')) return 'archive'
  return 'custom'
}

export class ZohoMailProvider implements MailProvider {
  readonly mode = 'zoho' as const

  private get mailApi() { return env('ZOHO_MAIL_API_URL', 'https://mail.zoho.com/api') }
  private get accountsUrl() { return env('ZOHO_ACCOUNTS_URL', 'https://accounts.zoho.com') }

  // ---- auth: the access token is cached in memory and refreshed shortly before it expires (Zoho limits how often tokens may be minted)
  private async accessToken(force = false): Promise<string> {
    const g = globalThis as unknown as Record<symbol, TokenCache | undefined>
    const cache = (g[KEY] ??= { token: '', expiresAt: 0 })
    if (!force && cache.token && Date.now() < cache.expiresAt - 60_000) return cache.token
    if (cache.pending) return cache.pending
    cache.pending = (async () => {
      const body = new URLSearchParams({ refresh_token: env('ZOHO_REFRESH_TOKEN'), client_id: env('ZOHO_CLIENT_ID'), client_secret: env('ZOHO_CLIENT_SECRET'), grant_type: 'refresh_token' })
      const res = await fetch(`${this.accountsUrl}/oauth/v2/token`, { method: 'POST', body })
      const json = (await res.json().catch(() => ({}))) as Json
      if (!res.ok || !json.access_token) throw new Error(`Zoho login failed: ${json.error ?? res.status}. Check ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN and ZOHO_ACCOUNTS_URL (data centre).`)
      cache.token = json.access_token as string
      cache.expiresAt = Date.now() + (Number(json.expires_in) || 3600) * 1000
      return cache.token
    })().finally(() => { cache.pending = undefined })
    return cache.pending
  }

  /** One HTTP call with token refresh on 401 and backoff + retry on rate limits (429) and server errors. */
  private async request(method: string, path: string, opts: { query?: Record<string, string | number | undefined>; json?: unknown; form?: FormData; binary?: boolean } = {}): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
    const url = new URL(`${this.mailApi}${path}`)
    for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
    let refreshed = false
    let forceToken = false
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const token = await this.accessToken(forceToken)
      forceToken = false
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Zoho-oauthtoken ${token}`, Accept: 'application/json', ...(opts.json ? { 'Content-Type': 'application/json' } : {}) },
        body: opts.form ?? (opts.json ? JSON.stringify(opts.json) : undefined),
      })
      if (res.status === 401 && !refreshed) { refreshed = true; forceToken = true; continue }
      if (res.status === 429 || res.status >= 500) {
        const wait = Number(res.headers.get('retry-after')) * 1000 || Math.min(30_000, 1000 * 2 ** attempt)
        await sleep(wait)
        continue
      }
      if (opts.binary) {
        if (!res.ok) throw new Error(`Zoho returned ${res.status} for the download.`)
        return { bytes: new Uint8Array(await res.arrayBuffer()), contentType: res.headers.get('content-type') ?? 'application/octet-stream' }
      }
      const json = (await res.json().catch(() => ({}))) as Json
      const code = json.status?.code
      if (!res.ok || (code && code !== 200 && code !== 201)) {
        const detail = json.data?.moreInfo ?? json.data?.errorCode ?? json.status?.description ?? res.statusText
        throw new Error(`Zoho Mail ${method} ${path.split('?')[0]} failed (${res.status}): ${detail}`)
      }
      return json.data ?? json
    }
    throw new Error('Zoho Mail is rate limiting this app. Try again in a minute.')
  }

  // ---- accounts
  async listAccounts(): Promise<ProviderAccount[]> {
    const wanted = configuredMailboxes()
    const data = (await this.request('GET', '/accounts')) as Json[]
    const found: ProviderAccount[] = []
    for (const email of wanted) {
      const hit = data.find((a) => {
        const addrs = [a.primaryEmailAddress, a.incomingUserName, a.mailboxAddress, ...(Array.isArray(a.emailAddress) ? a.emailAddress.map((e: Json) => e.mailId) : [])]
        return addrs.some((x) => typeof x === 'string' && x.toLowerCase() === email)
      })
      if (hit) found.push({ zohoAccountId: String(hit.accountId), email, displayName: String(hit.displayName || hit.accountDisplayName || hit.accountName || email) })
    }
    return found
  }

  async testConnection() {
    try {
      const accounts = await this.listAccounts()
      const wanted = configuredMailboxes()
      const missing = wanted.filter((w) => !accounts.some((a) => a.email === w))
      return {
        ok: accounts.length > 0,
        message: accounts.length
          ? `Connected to Zoho. Found ${accounts.length} of ${wanted.length} mailboxes${missing.length ? ` (not found for this login: ${missing.join(', ')})` : ''}.`
          : 'Connected to Zoho, but none of the configured mailboxes belong to this login. Authorise the Self Client with a user that owns them, or check MAIL_ACCOUNT_* values.',
        accounts,
      }
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'Could not connect to Zoho.', accounts: [] }
    }
  }

  // ---- folders and messages
  async listFolders(accountId: string): Promise<ProviderFolder[]> {
    const data = (await this.request('GET', `/accounts/${accountId}/folders`)) as Json[]
    return data.map((f) => ({
      zohoFolderId: String(f.folderId),
      name: String(f.folderName),
      type: folderType(String(f.folderName), String(f.folderType ?? '')),
      unreadCount: Number(f.unreadCount ?? 0),
      totalCount: Number(f.messageCount ?? 0),
    }))
  }

  private toSummary(accountId: string, folderId: string, m: Json): ProviderMessageSummary {
    const from = parseZohoAddresses(m.fromAddress ? (m.sender && !String(m.sender).includes('@') ? `"${m.sender}" <${m.fromAddress}>` : m.fromAddress) : m.sender)[0] ?? { email: String(m.fromAddress ?? '') }
    return {
      zohoMessageId: String(m.messageId),
      zohoFolderId: String(m.folderId ?? folderId),
      threadId: String(m.threadId ?? m.messageId),
      from,
      to: parseZohoAddresses(m.toAddress),
      cc: parseZohoAddresses(m.ccAddress),
      bcc: parseZohoAddresses(m.bccAddress),
      subject: decodeEntities(String(m.subject ?? '')),
      snippet: decodeEntities(String(m.summary ?? '')).replace(/\s+/g, ' ').trim().slice(0, 200),
      hasAttachments: String(m.hasAttachment ?? '0') === '1',
      isRead: String(m.status ?? '0') === '1',
      isStarred: Boolean(m.flagid && m.flagid !== 'flag_not_set'),
      receivedAt: new Date(Number(m.receivedTime ?? m.sentDateInGMT ?? Date.now())).toISOString(),
    }
  }

  async listMessages(accountId: string, folderId: string, { offset, limit }: ListMessagesParams): Promise<ListMessagesPage> {
    // Zoho's `start` is 1-based and `limit` is capped at 200.
    const data = (await this.request('GET', `/accounts/${accountId}/messages/view`, { query: { folderId, start: offset + 1, limit: Math.min(limit, 200), sortBy: 'date', sortorder: 'false' } })) as Json[]
    const messages = (Array.isArray(data) ? data : []).map((m) => this.toSummary(accountId, folderId, m))
    return { messages, hasMore: messages.length >= Math.min(limit, 200) }
  }

  async getMessage(accountId: string, folderId: string, messageId: string): Promise<ProviderMessageFull | null> {
    const base = `/accounts/${accountId}/folders/${folderId}/messages/${messageId}`
    try {
      const [content, details, attInfo] = await Promise.all([
        this.request('GET', `${base}/content`, { query: { includeBlockContent: 'true' } }),
        this.request('GET', `${base}/details`).catch(() => ({})),
        this.request('GET', `${base}/attachmentinfo`).catch(() => ({})),
      ])
      const html = String((content as Json).content ?? '')
      const att = ((attInfo as Json).attachments ?? []) as Json[]
      const summary = this.toSummary(accountId, folderId, { ...(details as Json), messageId, folderId })
      return {
        ...summary,
        snippet: summary.snippet || plainSnippet(html),
        htmlBody: html,
        textBody: plainSnippet(html, 5000),
        attachments: att.map((a) => ({ id: String(a.attachmentId), filename: String(a.attachmentName ?? 'attachment'), contentType: String(a.contentType ?? 'application/octet-stream'), size: Number(a.attachmentSize ?? 0) })),
      }
    } catch (error) {
      if (error instanceof Error && /failed \(404\)/.test(error.message)) return null
      throw error
    }
  }

  async getAttachment(accountId: string, folderId: string, messageId: string, attachmentId: string): Promise<ProviderAttachmentFile> {
    const info = await this.getMessage(accountId, folderId, messageId)
    const meta = info?.attachments.find((a) => a.id === attachmentId)
    const file = (await this.request('GET', `/accounts/${accountId}/folders/${folderId}/messages/${messageId}/attachments/${attachmentId}`, { query: { fileName: meta?.filename }, binary: true })) as { bytes: Uint8Array; contentType: string }
    return { filename: meta?.filename ?? 'attachment', contentType: meta?.contentType || file.contentType, bytes: file.bytes }
  }

  // ---- sending
  private async uploadAttachments(accountId: string, message: OutgoingMessage) {
    const out: Json[] = []
    for (const a of message.attachments ?? []) {
      const form = new FormData()
      form.append('attach', new Blob([Uint8Array.from(atob(a.contentBase64), (c) => c.charCodeAt(0))], { type: a.contentType }), a.filename)
      const up = (await this.request('POST', `/accounts/${accountId}/messages/attachments`, { query: { uploadType: 'multipart' }, form })) as Json | Json[]
      const first = Array.isArray(up) ? up[0] : up
      out.push({ storeName: first.storeName, attachmentName: first.attachmentName ?? a.filename, attachmentPath: first.attachmentPath })
    }
    return out
  }

  private payload(message: OutgoingMessage, attachments: Json[]) {
    const list = (a?: MailAddress[]) => (a ?? []).map((x) => x.email).join(',')
    return {
      fromAddress: message.from,
      toAddress: list(message.to),
      ccAddress: list(message.cc),
      bccAddress: list(message.bcc),
      subject: message.subject,
      content: message.htmlBody,
      mailFormat: 'html',
      askReceipt: 'no',
      ...(attachments.length ? { attachments } : {}),
    }
  }

  async sendMessage(accountId: string, message: OutgoingMessage) {
    const attachments = await this.uploadAttachments(accountId, message)
    const body = this.payload(message, attachments)
    const reply = message.inReplyTo
    const data = reply
      ? await this.request('POST', `/accounts/${accountId}/messages/${reply.zohoMessageId}`, { json: { ...body, action: reply.mode === 'replyAll' ? 'replyall' : reply.mode } })
      : await this.request('POST', `/accounts/${accountId}/messages`, { json: body })
    return { zohoMessageId: (data as Json)?.messageId ? String((data as Json).messageId) : undefined }
  }

  async saveDraft(accountId: string, message: OutgoingMessage, existingDraftId?: string) {
    const attachments = await this.uploadAttachments(accountId, message)
    const data = (await this.request('POST', `/accounts/${accountId}/messages`, { json: { ...this.payload(message, attachments), mode: 'draft' } })) as Json
    // Zoho creates a new draft each time; the previous version of the same draft is removed so there is only ever one.
    if (existingDraftId) {
      const folders = await this.listFolders(accountId)
      const drafts = folders.find((f) => f.type === 'drafts')
      if (drafts) await this.deleteMessages(accountId, drafts.zohoFolderId, [existingDraftId]).catch(() => undefined)
    }
    return { zohoMessageId: String(data.messageId) }
  }

  // ---- changing and deleting
  async updateMessages(accountId: string, folderId: string, ids: string[], action: MessageAction) {
    const base: Json = { messageId: ids.map(Number), folderId }
    const body: Json =
      action.type === 'move' ? { ...base, mode: MODES.move, destfolderId: action.destFolderId }
        : action.type === 'archive' ? { ...base, mode: MODES.archive }
          : action.type === 'spam' ? { ...base, mode: MODES.spam }
            : action.type === 'star' ? { ...base, mode: MODES.star, flagid: STAR_FLAG }
              : action.type === 'unstar' ? { ...base, mode: MODES.unstar }
                : { ...base, mode: action.type === 'markRead' ? MODES.markRead : MODES.markUnread }
    await this.request('PUT', `/accounts/${accountId}/updatemessage`, { json: body })
  }

  async deleteMessages(accountId: string, folderId: string, ids: string[]) {
    for (const id of ids) await this.request('DELETE', `/accounts/${accountId}/folders/${folderId}/messages/${id}`)
  }
}

import { configuredMailboxes, zohoCredsFor, type ZohoCreds } from './index'
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
  archive: 'archiveMails',
  spam: 'moveToSpam',
  star: 'setFlag',
  unstar: 'setFlag',
} as const
const STAR_FLAG = 'important'
const UNSTAR_FLAG = 'flag_not_set'

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

/** Zoho marks Notification and Newsletter with folderType "Inbox" and nests folders under their parent in `path`: only the real top-level folders get a standard type. */
function folderType(name: string, zohoType: string, path = ''): MailFolderType {
  if ((path.match(/\//g) ?? []).length > 1) return 'custom'
  const type = zohoType.toLowerCase()
  const lower = name.toLowerCase()
  if (type === 'inbox') return lower === 'inbox' ? 'inbox' : 'custom'
  if (type === 'sent') return 'sent'
  if (type === 'drafts') return 'drafts'
  if (type === 'spam') return 'spam'
  if (type === 'trash') return 'trash'
  if (type === 'archive') return 'archive'
  return 'custom'
}

const norm = (subject: string) => subject.toLowerCase().replace(/^(\s*(re|fw|fwd|aw|sv)\s*:\s*)+/i, '').replace(/\s+/g, ' ').trim()

export class ZohoMailProvider implements MailProvider {
  readonly mode = 'zoho' as const

  private get mailApi() { return env('ZOHO_MAIL_API_URL', 'https://mail.zoho.com/api') }
  private get accountsUrl() { return env('ZOHO_ACCOUNTS_URL', 'https://accounts.zoho.com') }

  // ---- auth: access tokens are cached in memory per refresh token and renewed shortly before they expire (Zoho limits how often tokens may be minted)
  private async accessToken(creds: ZohoCreds, force = false): Promise<string> {
    const g = globalThis as unknown as Record<symbol, Map<string, TokenCache> | undefined>
    const caches = (g[KEY] ??= new Map<string, TokenCache>())
    const cache = caches.get(creds.refreshToken) ?? { token: '', expiresAt: 0 }
    caches.set(creds.refreshToken, cache)
    if (!force && cache.token && Date.now() < cache.expiresAt - 60_000) return cache.token
    if (cache.pending) return cache.pending
    cache.pending = (async () => {
      const body = new URLSearchParams({ refresh_token: creds.refreshToken, client_id: creds.clientId, client_secret: creds.clientSecret, grant_type: 'refresh_token' })
      const res = await fetch(`${this.accountsUrl}/oauth/v2/token`, { method: 'POST', body })
      const json = (await res.json().catch(() => ({}))) as Json
      if (!res.ok || !json.access_token) throw new Error(`Zoho login failed: ${json.error ?? res.status}. Check the Zoho client id, secret and refresh token and ZOHO_ACCOUNTS_URL (data centre).`)
      cache.token = json.access_token as string
      cache.expiresAt = Date.now() + (Number(json.expires_in) || 3600) * 1000
      return cache.token
    })().finally(() => { cache.pending = undefined })
    return cache.pending
  }

  /** accountId -> the keys that can read it (filled by listAccounts, or looked up on demand after a restart). */
  private accountCreds = new Map<string, ZohoCreds>()

  private async credsOf(accountId: string): Promise<ZohoCreds> {
    const known = this.accountCreds.get(accountId)
    if (known) return known
    // One shared set of keys (the usual case): no lookup needed.
    const distinct = new Map<string, ZohoCreds>()
    for (const email of configuredMailboxes()) {
      const c = zohoCredsFor(email)
      if (c) distinct.set(c.refreshToken, c)
    }
    if (distinct.size === 1) return [...distinct.values()][0]
    // Several Zoho logins: find out which keys belong to this account.
    await this.listAccounts()
    const creds = this.accountCreds.get(accountId)
    if (!creds) throw new Error(`No Zoho credentials are configured for account ${accountId}.`)
    return creds
  }

  private async call(accountId: string, method: string, path: string, opts: Parameters<ZohoMailProvider['request']>[3] = {}) {
    return this.request(await this.credsOf(accountId), method, path, opts)
  }

  /** One HTTP call with token refresh on 401 and backoff + retry on rate limits (429) and server errors. */
  private async request(creds: ZohoCreds, method: string, path: string, opts: { query?: Record<string, string | number | undefined>; json?: unknown; rawJson?: string; form?: FormData; binary?: boolean } = {}): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
    const url = new URL(`${this.mailApi}${path}`)
    for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
    let refreshed = false
    let forceToken = false
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const token = await this.accessToken(creds, forceToken)
      forceToken = false
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Zoho-oauthtoken ${token}`, Accept: 'application/json', ...(opts.json || opts.rawJson ? { 'Content-Type': 'application/json' } : {}) },
        body: opts.form ?? opts.rawJson ?? (opts.json ? JSON.stringify(opts.json) : undefined),
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
    const found: ProviderAccount[] = []
    const cache = new Map<string, Json[]>() // mailboxes that share keys are looked up with one call
    for (const email of configuredMailboxes()) {
      const creds = zohoCredsFor(email)
      if (!creds) continue
      if (!cache.has(creds.refreshToken)) cache.set(creds.refreshToken, (await this.request(creds, 'GET', '/accounts')) as Json[])
      const hit = cache.get(creds.refreshToken)!.find((a) => {
        const addrs = [a.primaryEmailAddress, a.incomingUserName, a.mailboxAddress, ...(Array.isArray(a.emailAddress) ? a.emailAddress.map((e: Json) => (typeof e === 'string' ? e : e.mailId)) : [])]
        return addrs.some((x) => typeof x === 'string' && x.toLowerCase() === email)
      })
      if (hit) {
        found.push({ zohoAccountId: String(hit.accountId), email, displayName: String(hit.displayName || hit.accountDisplayName || hit.accountName || email) })
        this.accountCreds.set(String(hit.accountId), creds)
      }
    }
    return found
  }

  async testConnection() {
    try {
      const wanted = configuredMailboxes()
      const accounts = await this.listAccounts()
      const missing = wanted.filter((w) => !accounts.some((a) => a.email === w))
      const noKeys = missing.filter((m) => !zohoCredsFor(m))
      return {
        ok: accounts.length > 0,
        message: accounts.length
          ? `Connected to Zoho. Found ${accounts.length} of ${wanted.length} mailboxes${missing.length ? `. Not found: ${missing.join(', ')}${noKeys.length ? ` (no keys set for ${noKeys.join(', ')})` : ' (the keys used belong to a different Zoho login; add keys for that mailbox)'}` : ''}.`
          : 'Connected to Zoho, but none of the configured mailboxes belong to the login these keys were made with. Each mailbox needs keys made while signed in to that mailbox (see the README, "one set of keys per mailbox").',
        accounts,
      }
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'Could not connect to Zoho.', accounts: [] }
    }
  }

  // ---- folders and messages
  async listFolders(accountId: string): Promise<ProviderFolder[]> {
    const data = (await this.call(accountId, 'GET', `/accounts/${accountId}/folders`)) as Json[]
    return data.map((f) => ({
      zohoFolderId: String(f.folderId),
      name: String(f.folderName),
      type: folderType(String(f.folderName), String(f.folderType ?? ''), String(f.path ?? '')),
      // The folder list carries no counts; the CMS counts from its own cache, and the import learns the real total as it goes.
      unreadCount: Number(f.unreadCount ?? 0),
      totalCount: Number(f.messageCount ?? 0),
    }))
  }

  private toSummary(accountId: string, folderId: string, m: Json): ProviderMessageSummary {
    const from = parseZohoAddresses(m.fromAddress ? (m.sender && !String(m.sender).includes('@') ? `"${m.sender}" <${m.fromAddress}>` : m.fromAddress) : m.sender)[0] ?? { email: String(m.fromAddress ?? '') }
    const to = parseZohoAddresses(m.toAddress)
    const subject = decodeEntities(String(m.subject ?? ''))
    // Zoho's list does not return a conversation id, so mail is grouped like Gmail's fallback: same subject (without Re:/Fwd:) with the same
    // outside person, in either direction. Mail with no subject stays on its own.
    const own = new Set(configuredMailboxes())
    const outsider = [from, ...to].find((a) => a.email && !own.has(a.email.toLowerCase()))?.email.toLowerCase() ?? ''
    const key = norm(subject)
    const threadId = m.threadId ? String(m.threadId) : key.length > 2 && outsider ? `${key}|${outsider}` : String(m.messageId)
    return {
      zohoMessageId: String(m.messageId),
      zohoFolderId: String(m.folderId ?? folderId),
      threadId,
      from,
      to,
      cc: parseZohoAddresses(m.ccAddress),
      bcc: parseZohoAddresses(m.bccAddress),
      subject,
      snippet: decodeEntities(String(m.summary ?? '')).replace(/\s+/g, ' ').trim().slice(0, 200),
      hasAttachments: String(m.hasAttachment ?? '0') === '1',
      isRead: String(m.status ?? '0') === '1',
      isStarred: Boolean(m.flagid && m.flagid !== 'flag_not_set'),
      receivedAt: new Date(Number(m.receivedTime ?? m.sentDateInGMT ?? Date.now())).toISOString(),
    }
  }

  async listMessages(accountId: string, folderId: string, { offset, limit }: ListMessagesParams): Promise<ListMessagesPage> {
    // Zoho's `start` is 1-based and `limit` is capped at 200.
    const data = (await this.call(accountId, 'GET', `/accounts/${accountId}/messages/view`, { query: { folderId, start: offset + 1, limit: Math.min(limit, 200), sortBy: 'date', sortorder: 'false' } })) as Json[]
    const messages = (Array.isArray(data) ? data : []).map((m) => this.toSummary(accountId, folderId, m))
    return { messages, hasMore: messages.length >= Math.min(limit, 200) }
  }

  async getMessage(accountId: string, folderId: string, messageId: string): Promise<ProviderMessageFull | null> {
    const base = `/accounts/${accountId}/folders/${folderId}/messages/${messageId}`
    try {
      const [content, details, attInfo] = await Promise.all([
        this.call(accountId, 'GET', `${base}/content`, { query: { includeBlockContent: 'true' } }),
        this.call(accountId, 'GET', `${base}/details`).catch(() => ({})),
        this.call(accountId, 'GET', `${base}/attachmentinfo`).catch(() => ({})),
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
    const file = (await this.call(accountId, 'GET', `/accounts/${accountId}/folders/${folderId}/messages/${messageId}/attachments/${attachmentId}`, { query: { fileName: meta?.filename }, binary: true })) as { bytes: Uint8Array; contentType: string }
    return { filename: meta?.filename ?? 'attachment', contentType: meta?.contentType || file.contentType, bytes: file.bytes }
  }

  // ---- sending
  private async uploadAttachments(accountId: string, message: OutgoingMessage) {
    const out: Json[] = []
    for (const a of message.attachments ?? []) {
      const form = new FormData()
      form.append('attach', new Blob([Uint8Array.from(atob(a.contentBase64), (c) => c.charCodeAt(0))], { type: a.contentType }), a.filename)
      const up = (await this.call(accountId, 'POST', `/accounts/${accountId}/messages/attachments`, { query: { uploadType: 'multipart' }, form })) as Json | Json[]
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
      ? await this.call(accountId, 'POST', `/accounts/${accountId}/messages/${reply.zohoMessageId}`, { json: { ...body, action: reply.mode === 'replyAll' ? 'replyall' : reply.mode } })
      : await this.call(accountId, 'POST', `/accounts/${accountId}/messages`, { json: body })
    return { zohoMessageId: (data as Json)?.messageId ? String((data as Json).messageId) : undefined }
  }

  async saveDraft(accountId: string, message: OutgoingMessage, existingDraftId?: string) {
    const attachments = await this.uploadAttachments(accountId, message)
    const data = (await this.call(accountId, 'POST', `/accounts/${accountId}/messages`, { json: { ...this.payload(message, attachments), mode: 'draft' } })) as Json
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
    // Zoho ids are 19 digits (beyond Number.MAX_SAFE_INTEGER) and the API wants JSON numbers, so they go in as strings
    // and are turned into bare digits after stringifying, otherwise they get rounded and the update silently misses.
    const base: Json = { messageId: ids.map((id) => `@@${id}@@`), folderId: `@@${folderId}@@` }
    const body: Json =
      action.type === 'move' ? { ...base, mode: MODES.move, destfolderId: `@@${action.destFolderId}@@` }
        : action.type === 'archive' ? { ...base, mode: MODES.archive }
          : action.type === 'spam' ? { ...base, mode: MODES.spam }
            : action.type === 'star' ? { ...base, mode: MODES.star, flagid: STAR_FLAG }
              : action.type === 'unstar' ? { ...base, mode: MODES.unstar, flagid: UNSTAR_FLAG }
                : { ...base, mode: action.type === 'markRead' ? MODES.markRead : MODES.markUnread }
    await this.call(accountId, 'PUT', `/accounts/${accountId}/updatemessage`, { rawJson: JSON.stringify(body).replace(/"@@(\d+)@@"/g, '$1') })
  }

  async deleteMessages(accountId: string, folderId: string, ids: string[]) {
    for (const id of ids) await this.call(accountId, 'DELETE', `/accounts/${accountId}/folders/${folderId}/messages/${id}`)
  }
}

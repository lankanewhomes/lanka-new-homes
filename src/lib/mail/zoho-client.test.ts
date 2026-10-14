import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parseZohoAddresses, ZohoMailProvider } from './zoho-client'

type Call = { url: string; method: string; headers: Record<string, string>; body?: string }

function setupFetch(handler: (c: Call) => { status?: number; json?: unknown; headers?: Record<string, string>; bytes?: Uint8Array }) {
  const calls: Call[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: URL | string, init?: RequestInit) => {
    const call: Call = { url: String(url), method: init?.method ?? 'GET', headers: (init?.headers ?? {}) as Record<string, string>, body: typeof init?.body === 'string' ? init.body : init?.body instanceof URLSearchParams ? init.body.toString() : undefined }
    calls.push(call)
    const r = handler(call)
    const status = r.status ?? 200
    return {
      ok: status >= 200 && status < 300, status, statusText: 'x', headers: new Headers(r.headers ?? {}),
      json: async () => r.json ?? {}, arrayBuffer: async () => (r.bytes ?? new Uint8Array()).buffer,
    } as unknown as Response
  }))
  return calls
}

describe('parseZohoAddresses', () => {
  it('parses escaped Zoho address strings', () => {
    expect(parseZohoAddresses('&quot;Erwan Smith&quot;&lt;contact@maisonceylon.com&gt;,a@b.com')).toEqual([{ name: 'Erwan Smith', email: 'contact@maisonceylon.com' }, { email: 'a@b.com' }])
    expect(parseZohoAddresses('"Doe, John" <j@d.com>')).toEqual([{ name: 'Doe, John', email: 'j@d.com' }])
    expect(parseZohoAddresses('')).toEqual([])
  })
})

describe('ZohoMailProvider (fetch stubbed)', () => {
  beforeEach(() => {
    vi.stubEnv('ZOHO_CLIENT_ID', 'cid'); vi.stubEnv('ZOHO_CLIENT_SECRET', 'sec'); vi.stubEnv('ZOHO_REFRESH_TOKEN', 'ref')
    vi.stubEnv('ZOHO_ACCOUNTS_URL', 'https://accounts.zohocloud.ca'); vi.stubEnv('ZOHO_MAIL_API_URL', 'https://mail.zohocloud.ca/api')
    // a fresh token cache for each test
    ;(globalThis as unknown as Record<symbol, unknown>)[Symbol.for('lnh.zoho.token')] = undefined
  })
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

  const ok = (data: unknown) => ({ json: { status: { code: 200 }, data } })
  const token = (c: Call) => (c.url.includes('/oauth/v2/token') ? { json: { access_token: 'tok', expires_in: 3600 } } : null)

  it('refreshes the token once and sends it on every call', async () => {
    const calls = setupFetch((c) => token(c) ?? ok([{ accountId: 1, primaryEmailAddress: 'support@lankanewhomes.com', displayName: 'Support' }]))
    const z = new ZohoMailProvider()
    const accounts = await z.listAccounts()
    await z.listAccounts()
    expect(accounts).toEqual([{ zohoAccountId: '1', email: 'support@lankanewhomes.com', displayName: 'Support' }])
    expect(calls.filter((c) => c.url.includes('/oauth/v2/token'))).toHaveLength(1)
    expect(calls[0].url).toBe('https://accounts.zohocloud.ca/oauth/v2/token')
    expect(calls[0].body).toContain('grant_type=refresh_token')
    expect(calls[1].url).toBe('https://mail.zohocloud.ca/api/accounts')
    expect(calls[1].headers.Authorization).toBe('Zoho-oauthtoken tok')
  })

  it('maps folders and messages', async () => {
    setupFetch((c) => token(c) ?? (c.url.includes('/folders') ? ok([{ folderId: '11', folderName: 'Inbox', folderType: 'Inbox', unreadCount: 3, messageCount: 40 }, { folderId: '12', folderName: 'Buyers', folderType: 'UserFolder', unreadCount: 0, messageCount: 5 }])
      : ok([{ messageId: '9', folderId: '11', subject: 'Hello &amp; welcome', summary: 'Hi there', fromAddress: 'a@b.com', sender: 'Alice', toAddress: '&lt;support@lankanewhomes.com&gt;', hasAttachment: '1', status: '0', flagid: 'flag_important', receivedTime: '1760000000000' }])))
    const z = new ZohoMailProvider()
    expect((await z.listFolders('1')).map((f) => [f.name, f.type, f.unreadCount])).toEqual([['Inbox', 'inbox', 3], ['Buyers', 'custom', 0]])
    const page = await z.listMessages('1', '11', { offset: 0, limit: 200 })
    expect(page.messages[0]).toMatchObject({ zohoMessageId: '9', subject: 'Hello & welcome', isRead: false, isStarred: true, hasAttachments: true, from: { name: 'Alice', email: 'a@b.com' } })
    expect(page.hasMore).toBe(false)
  })

  it('pages with a 1-based start and caps the limit at 200', async () => {
    const calls = setupFetch((c) => token(c) ?? ok([]))
    await new ZohoMailProvider().listMessages('1', '11', { offset: 400, limit: 500 })
    const url = new URL(calls[1].url)
    expect(url.searchParams.get('start')).toBe('401')
    expect(url.searchParams.get('limit')).toBe('200')
    expect(url.searchParams.get('folderId')).toBe('11')
  })

  it('sends mail, replies and updates messages with the right payloads', async () => {
    const calls = setupFetch((c) => token(c) ?? ok({ messageId: '77' }))
    const z = new ZohoMailProvider()
    await z.sendMessage('1', { from: 'support@lankanewhomes.com', to: [{ email: 'a@b.com' }], cc: [{ email: 'c@d.com' }], subject: 'Hi', htmlBody: '<p>x</p>' })
    await z.sendMessage('1', { from: 'support@lankanewhomes.com', to: [{ email: 'a@b.com' }], subject: 'Re: Hi', htmlBody: '<p>y</p>', inReplyTo: { zohoFolderId: '11', zohoMessageId: '9', mode: 'replyAll' } })
    await z.updateMessages('1', '11', ['9', '10'], { type: 'star' })
    await z.updateMessages('1', '11', ['9'], { type: 'move', destFolderId: '12' })
    const sent = calls.find((c) => c.method === 'POST' && c.url.endsWith('/accounts/1/messages'))!
    expect(JSON.parse(sent.body!)).toMatchObject({ fromAddress: 'support@lankanewhomes.com', toAddress: 'a@b.com', ccAddress: 'c@d.com', subject: 'Hi', mailFormat: 'html' })
    const reply = calls.find((c) => c.url.endsWith('/accounts/1/messages/9'))!
    expect(JSON.parse(reply.body!).action).toBe('replyall')
    const puts = calls.filter((c) => c.method === 'PUT').map((c) => JSON.parse(c.body!))
    expect(puts[0]).toMatchObject({ mode: 'setFlag', messageId: [9, 10], folderId: 11, flagid: 'important' })
    expect(puts[1]).toMatchObject({ mode: 'moveMessage', destfolderId: 12 })
  })

  it('retries after a rate limit and refreshes an expired token', async () => {
    vi.useFakeTimers()
    let hits = 0
    const calls = setupFetch((c) => {
      const t = token(c)
      if (t) return t
      hits += 1
      if (hits === 1) return { status: 401 }
      if (hits === 2) return { status: 429, headers: { 'retry-after': '1' } }
      return ok([])
    })
    const p = new ZohoMailProvider().listFolders('1')
    await vi.advanceTimersByTimeAsync(2000)
    await p
    vi.useRealTimers()
    expect(calls.filter((c) => c.url.includes('/oauth/v2/token')).length).toBe(2)
    expect(hits).toBe(3)
  })

  it('uses each mailbox\'s own keys when they are set', async () => {
    vi.stubEnv('ZOHO_CLIENT_ID_SUPPORT', 'cid-s'); vi.stubEnv('ZOHO_CLIENT_SECRET_SUPPORT', 'sec-s'); vi.stubEnv('ZOHO_REFRESH_TOKEN_SUPPORT', 'ref-s')
    const calls = setupFetch((c) => {
      if (c.url.includes('/oauth/v2/token')) return { json: { access_token: c.body!.includes('refresh_token=ref-s') ? 'tok-support' : 'tok-shared', expires_in: 3600 } }
      return ok([{ accountId: c.headers.Authorization.endsWith('tok-support') ? 22 : 11, primaryEmailAddress: c.headers.Authorization.endsWith('tok-support') ? 'support@lankanewhomes.com' : 'developers@lankanewhomes.com' }])
    })
    const z = new ZohoMailProvider()
    const accounts = await z.listAccounts()
    expect(accounts.map((a) => [a.email, a.zohoAccountId])).toEqual([['support@lankanewhomes.com', '22'], ['developers@lankanewhomes.com', '11']])
    await z.listFolders('22')
    await z.listFolders('11')
    const folderCalls = calls.filter((c) => c.url.includes('/folders'))
    expect(folderCalls[0].headers.Authorization).toBe('Zoho-oauthtoken tok-support')
    expect(folderCalls[1].headers.Authorization).toBe('Zoho-oauthtoken tok-shared')
  })

  it('maps real Zoho folder shapes: Notification/Newsletter and nested folders are custom', async () => {
    setupFetch((c) => token(c) ?? ok([
      { folderId: '1', folderName: 'Inbox', folderType: 'Inbox', path: '/Inbox' },
      { folderId: '2', folderName: 'Notification', folderType: 'Inbox', path: '/Notification' },
      { folderId: '3', folderName: 'Archive', folderType: 'Archive', path: '/Archive' },
      { folderId: '4', folderName: 'Zoho Mail', folderType: 'Archive', path: '/Archive/Zoho Mail' },
    ]))
    const folders = await new ZohoMailProvider().listFolders('1')
    expect(folders.map((f) => f.type)).toEqual(['inbox', 'custom', 'archive', 'custom'])
  })

  it('groups mail into threads by subject and the outside person', async () => {
    setupFetch((c) => token(c) ?? ok([
      { messageId: '1', folderId: '1', subject: 'Question about Oceanista', fromAddress: 'buyer@x.com', toAddress: 'support@lankanewhomes.com', receivedTime: '1' },
      { messageId: '2', folderId: '2', subject: 'Re: Question about Oceanista', fromAddress: 'support@lankanewhomes.com', toAddress: 'buyer@x.com', receivedTime: '2' },
      { messageId: '3', folderId: '1', subject: 'Question about Oceanista', fromAddress: 'other@y.com', toAddress: 'support@lankanewhomes.com', receivedTime: '3' },
    ]))
    const page = await new ZohoMailProvider().listMessages('1', '1', { offset: 0, limit: 200 })
    const t = page.messages.map((m) => m.threadId)
    expect(t[0]).toBe(t[1])
    expect(t[2]).not.toBe(t[0])
  })

  it('reports a clear message when the credentials are rejected', async () => {
    setupFetch((c) => (c.url.includes('/oauth/v2/token') ? { status: 400, json: { error: 'invalid_client' } } : ok([])))
    const r = await new ZohoMailProvider().testConnection()
    expect(r.ok).toBe(false)
    expect(r.message).toContain('invalid_client')
  })
})

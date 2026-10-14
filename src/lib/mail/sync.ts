/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs and raw rows are loosely typed here */
import type { Payload } from 'payload'
import { configuredMailboxes } from './index'
import type { MailProvider, ProviderFolder, ProviderMessageSummary } from './types'

// Full import + incremental sync between the mail provider (Zoho or the mock) and the Payload cache.
//  - Import: every folder, newest first, in resumable batches (state in mail-sync-state), so it never times out; metadata only.
//  - Incremental: newest page + a rotating "reconcile" window per folder, so new mail, read/star changes, moves and deletions made
//    in Zoho show up. Zoho always wins: cached rows are overwritten from the provider.
// Bulk writes use SQL (one statement per batch) because one Payload create per message would be far too slow for a full history.

const PAGE = 200
const TOP_WINDOW = 100
const COLORS = ['#2563eb', '#16a34a', '#c2410c']

type Pool = { query: (text: string, values?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }> }
const poolOf = (payload: Payload) => (payload.db as unknown as { pool: Pool }).pool
const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null)

export type AccountRow = { id: number; email: string; zohoAccountId: string; displayName: string; color: string; signature: string; source: string }
export type FolderRow = { id: number; zohoFolderId: string; name: string; type: string; unreadCount: number; totalCount: number }

export type SyncReport = {
  mode: 'import' | 'incremental' | 'auto'
  provider: 'mock' | 'zoho'
  done: boolean
  startedAt: string
  durationMs: number
  accounts: { email: string; folders: { name: string; step: 'import' | 'incremental' | 'complete' | 'skipped'; upserted: number; inserted: number; removed: number }[]; error?: string }[]
  warnings: string[]
}

// ---------- accounts & folders ----------

async function purgeAccount(payload: Payload, accountId: number) {
  const pool = poolOf(payload)
  await pool.query('delete from payload.mail_messages where account_id = $1', [accountId])
  await pool.query('delete from payload.mail_sync_state where account_id = $1', [accountId])
  await pool.query('delete from payload.mail_folders where account_id = $1', [accountId])
}

export async function ensureAccounts(payload: Payload, provider: MailProvider): Promise<{ accounts: AccountRow[]; warnings: string[] }> {
  const providerAccounts = await provider.listAccounts()
  const warnings: string[] = []
  const rows: AccountRow[] = []
  for (const [index, email] of configuredMailboxes().entries()) {
    const remote = providerAccounts.find((a) => a.email.toLowerCase() === email)
    if (!remote) { warnings.push(`${email} was not found in the connected Zoho organisation.`); continue }
    const found = (await payload.find({ collection: 'mail-accounts', where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] as any
    if (found) {
      if (found.source && found.source !== provider.mode) await purgeAccount(payload, found.id)
      const changed = found.zohoAccountId !== remote.zohoAccountId || found.source !== provider.mode || !found.displayName
      const updated = changed
        ? ((await payload.update({ collection: 'mail-accounts', id: found.id, overrideAccess: true, data: { zohoAccountId: remote.zohoAccountId, source: provider.mode, displayName: found.displayName || remote.displayName } as never })) as any)
        : found
      rows.push({ id: updated.id, email, zohoAccountId: remote.zohoAccountId, displayName: updated.displayName, color: updated.color ?? COLORS[index], signature: updated.signature ?? '', source: provider.mode })
    } else {
      const created = (await payload.create({ collection: 'mail-accounts', overrideAccess: true, data: { email, displayName: remote.displayName, zohoAccountId: remote.zohoAccountId, source: provider.mode, color: COLORS[index % COLORS.length], active: true } as never })) as any
      rows.push({ id: created.id, email, zohoAccountId: remote.zohoAccountId, displayName: created.displayName, color: created.color, signature: '', source: provider.mode })
    }
  }
  return { accounts: rows, warnings }
}

export async function syncFolders(payload: Payload, provider: MailProvider, account: AccountRow): Promise<FolderRow[]> {
  const remote = await provider.listFolders(account.zohoAccountId)
  const existing = (await payload.find({ collection: 'mail-folders', where: { account: { equals: account.id } }, limit: 500, depth: 0, pagination: false, overrideAccess: true })).docs as any[]
  const out: FolderRow[] = []
  for (const f of remote) {
    const hit = existing.find((e) => e.zohoFolderId === f.zohoFolderId)
    const data = { account: account.id, zohoFolderId: f.zohoFolderId, name: f.name, type: f.type, unreadCount: f.unreadCount, totalCount: f.totalCount }
    const doc = hit
      ? hit.name === f.name && hit.type === f.type && hit.unreadCount === f.unreadCount && hit.totalCount === f.totalCount
        ? hit
        : await payload.update({ collection: 'mail-folders', id: hit.id, data: data as never, overrideAccess: true })
      : await payload.create({ collection: 'mail-folders', data: data as never, overrideAccess: true })
    out.push({ id: (doc as any).id, zohoFolderId: f.zohoFolderId, name: f.name, type: f.type, unreadCount: f.unreadCount, totalCount: f.totalCount })
  }
  // Folders deleted in Zoho disappear here too (with their cached messages).
  const gone = existing.filter((e) => !remote.some((f) => f.zohoFolderId === e.zohoFolderId))
  const pool = poolOf(payload)
  for (const g of gone) {
    await pool.query('delete from payload.mail_messages where folder_id = $1', [g.id])
    await pool.query('delete from payload.mail_sync_state where folder_id = $1', [g.id])
    await payload.delete({ collection: 'mail-folders', id: g.id, overrideAccess: true })
  }
  return out
}

// ---------- state ----------

const stateCache = new WeakMap<Payload, Map<string, any>>()
function cacheKey(accountId: number, folder: FolderRow | null) { return `${accountId}:${folder?.id ?? 'account'}` }

/** Loads every state row of a mailbox with one query so the per-folder lookups below do not each hit the database. */
async function primeStates(payload: Payload, accountId: number) {
  const rows = (await payload.find({ collection: 'mail-sync-state', where: { account: { equals: accountId } }, limit: 500, depth: 0, pagination: false, overrideAccess: true })).docs as any[]
  const map = stateCache.get(payload) ?? new Map<string, any>()
  for (const r of rows) map.set(`${accountId}:${r.folder ? (typeof r.folder === 'object' ? r.folder.id : r.folder) : 'account'}`, r)
  stateCache.set(payload, map)
}

async function getState(payload: Payload, accountId: number, folder: FolderRow | null): Promise<any> {
  const cached = stateCache.get(payload)?.get(cacheKey(accountId, folder))
  if (cached) return cached
  const created = await getStateUncached(payload, accountId, folder)
  const map = stateCache.get(payload) ?? new Map<string, any>()
  map.set(cacheKey(accountId, folder), created)
  stateCache.set(payload, map)
  return created
}

async function getStateUncached(payload: Payload, accountId: number, folder: FolderRow | null): Promise<any> {
  const where = folder ? { and: [{ account: { equals: accountId } }, { folder: { equals: folder.id } }] } : { and: [{ account: { equals: accountId } }, { folder: { exists: false } }] }
  const found = (await payload.find({ collection: 'mail-sync-state', where: where as never, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (found) return found
  return payload.create({ collection: 'mail-sync-state', overrideAccess: true, data: { account: accountId, ...(folder ? { folder: folder.id, zohoFolderId: folder.zohoFolderId } : {}), importStatus: 'pending' } as never })
}

const saveState = async (payload: Payload, id: number, data: Record<string, unknown>) => {
  const updated = await payload.update({ collection: 'mail-sync-state', id, data: data as never, overrideAccess: true })
  const map = stateCache.get(payload)
  if (map) for (const [k, v] of map) if (v.id === id) map.set(k, updated)
  return updated
}

// ---------- bulk writes ----------

export async function upsertMessages(payload: Payload, account: AccountRow, folderId: number, msgs: ProviderMessageSummary[]): Promise<{ upserted: number; inserted: number }> {
  if (!msgs.length) return { upserted: 0, inserted: 0 }
  const pool = poolOf(payload)
  let upserted = 0
  let inserted = 0
  for (let i = 0; i < msgs.length; i += 100) {
    const chunk = msgs.slice(i, i + 100)
    const values: unknown[] = []
    const tuples = chunk.map((m, n) => {
      const b = n * 14
      values.push(`${account.zohoAccountId}:${m.zohoMessageId}`, account.id, folderId, m.zohoMessageId, m.threadId, m.from.name ?? null, m.from.email, JSON.stringify(m.to), JSON.stringify(m.cc), JSON.stringify(m.bcc), m.subject, m.snippet, m.hasAttachments, `${m.isRead}|${m.isStarred}|${m.receivedAt}`)
      return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8}::jsonb,$${b + 9}::jsonb,$${b + 10}::jsonb,$${b + 11},$${b + 12},$${b + 13},split_part($${b + 14},'|',1)::boolean,split_part($${b + 14},'|',2)::boolean,split_part($${b + 14},'|',3)::timestamptz,now(),now())`
    })
    const res = await pool.query(
      `insert into payload.mail_messages (message_key, account_id, folder_id, zoho_message_id, thread_id, from_name, from_email, to_addresses, cc_addresses, bcc_addresses, subject, snippet, has_attachments, is_read, is_starred, received_at, updated_at, created_at)
       values ${tuples.join(',')}
       on conflict (message_key) do update set folder_id = excluded.folder_id, thread_id = excluded.thread_id, from_name = excluded.from_name, from_email = excluded.from_email,
         to_addresses = excluded.to_addresses, cc_addresses = excluded.cc_addresses, bcc_addresses = excluded.bcc_addresses, subject = excluded.subject, snippet = excluded.snippet,
         has_attachments = excluded.has_attachments, is_read = excluded.is_read, is_starred = excluded.is_starred, received_at = excluded.received_at, updated_at = now()
       returning (xmax = 0) as inserted`,
      values,
    )
    upserted += res.rowCount ?? 0
    inserted += res.rows.filter((r) => r.inserted).length
  }
  return { upserted, inserted }
}

/** Drop cached messages inside a window that Zoho no longer lists (deleted, or moved out). Boundaries are exclusive so ties are never removed. Rows with a `local-` id (outreach emails sent before the Zoho connection) only exist here, so they are kept. */
export async function removeMissingInWindow(payload: Payload, accountId: number, folderId: number, keepIds: string[], after: string | null, before: string | null): Promise<number> {
  const res = await poolOf(payload).query(
    `delete from payload.mail_messages where account_id = $1 and folder_id = $2
       and ($3::timestamptz is null or received_at > $3) and ($4::timestamptz is null or received_at < $4)
       and not (zoho_message_id = any($5::text[]))
       and zoho_message_id not like 'local-%'`,
    [accountId, folderId, after, before, keepIds],
  )
  return res.rowCount ?? 0
}

// ---------- per-folder steps ----------

async function importFolderBatches(payload: Payload, provider: MailProvider, account: AccountRow, folder: FolderRow, deadline: number) {
  const state = await getState(payload, account.id, folder)
  let offset = Number(state.importOffset ?? 0)
  let upserted = 0
  let inserted = 0
  await saveState(payload, state.id, { importStatus: 'running', lastError: null })
  try {
    for (;;) {
      // Always imports at least one batch per call, so a call can never end without progress however small the time budget.
      const page = await provider.listMessages(account.zohoAccountId, folder.zohoFolderId, { offset, limit: PAGE })
      const r = await upsertMessages(payload, account, folder.id, page.messages)
      upserted += r.upserted
      inserted += r.inserted
      offset += page.messages.length
      const complete = !page.hasMore || page.messages.length === 0
      await saveState(payload, state.id, {
        importOffset: offset, importedCount: offset, totalCount: page.total ?? Math.max(offset, state.totalCount ?? 0), importStatus: complete ? 'complete' : 'running',
        lastSyncedAt: new Date().toISOString(), ...(page.messages[0] && offset <= PAGE ? { lastMessageAt: iso(page.messages[0].receivedAt) } : {}),
      })
      if (complete) return { done: true, upserted, inserted }
      if (Date.now() > deadline) return { done: false, upserted, inserted }
    }
  } catch (error) {
    await saveState(payload, state.id, { importStatus: 'error', lastError: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

async function incrementalFolder(payload: Payload, provider: MailProvider, account: AccountRow, folder: FolderRow) {
  const state = await getState(payload, account.id, folder)
  let upserted = 0
  let inserted = 0
  let removed = 0
  // 1) newest page: new mail + recent read/star/move/delete changes
  const top = await provider.listMessages(account.zohoAccountId, folder.zohoFolderId, { offset: 0, limit: TOP_WINDOW })
  const t = await upsertMessages(payload, account, folder.id, top.messages)
  upserted += t.upserted
  inserted += t.inserted
  const topMin = top.hasMore && top.messages.length ? top.messages[top.messages.length - 1].receivedAt : null
  removed += await removeMissingInWindow(payload, account.id, folder.id, top.messages.map((m) => m.zohoMessageId), topMin, null)
  // 2) rotating window further back: catches older changes and deletions over time
  let reconcile = Number(state.reconcileOffset ?? 0)
  if (reconcile < TOP_WINDOW) reconcile = TOP_WINDOW
  if (top.hasMore) {
    const win = await provider.listMessages(account.zohoAccountId, folder.zohoFolderId, { offset: reconcile, limit: PAGE })
    const w = await upsertMessages(payload, account, folder.id, win.messages)
    upserted += w.upserted
    inserted += w.inserted
    if (win.messages.length) {
      removed += await removeMissingInWindow(payload, account.id, folder.id, win.messages.map((m) => m.zohoMessageId), win.hasMore ? win.messages[win.messages.length - 1].receivedAt : null, win.messages[0].receivedAt)
    }
    reconcile = win.hasMore ? reconcile + PAGE : 0
  } else reconcile = 0
  await saveState(payload, state.id, { reconcileOffset: reconcile, lastSyncedAt: new Date().toISOString(), lastError: null, totalCount: top.total ?? state.totalCount, ...(top.messages[0] ? { lastMessageAt: iso(top.messages[0].receivedAt) } : {}) })
  return { upserted, inserted, removed }
}

/**
 * After the CMS changes something in Zoho (send, draft…), re-read just the affected folders so the cache matches Zoho.
 * Deliberately lean (a few queries, no full folder/account sync) because the user is waiting on it.
 */
export async function quickRefresh(payload: Payload, provider: MailProvider, accountId: number, folderTypes: string[]) {
  const pool = poolOf(payload)
  const acc = (await pool.query('select id, email, zoho_account_id from payload.mail_accounts where id = $1', [accountId])).rows[0]
  if (!acc) return
  const account: AccountRow = { id: acc.id, email: acc.email, zohoAccountId: acc.zoho_account_id, displayName: '', color: '', signature: '', source: provider.mode }
  const rows = (await pool.query('select id, zoho_folder_id, name, type from payload.mail_folders where account_id = $1 and type::text = any($2::text[])', [accountId, folderTypes])).rows
  await primeStates(payload, accountId)
  for (const r of rows) {
    const folder: FolderRow = { id: r.id, zohoFolderId: r.zoho_folder_id, name: r.name, type: r.type, unreadCount: 0, totalCount: 0 }
    const state = await getState(payload, account.id, folder)
    if (state.importStatus === 'complete') await incrementalFolder(payload, provider, account, folder)
    else {
      const page = await provider.listMessages(account.zohoAccountId, folder.zohoFolderId, { offset: 0, limit: 50 })
      await upsertMessages(payload, account, folder.id, page.messages)
    }
  }
}

// ---------- entry points ----------

export async function runSync(payload: Payload, provider: MailProvider, opts: { mode?: 'import' | 'incremental' | 'auto'; budgetMs?: number; accountEmail?: string; force?: boolean } = {}): Promise<SyncReport> {
  const mode = opts.mode ?? 'auto'
  const started = Date.now()
  const deadline = started + (opts.budgetMs ?? 25_000)
  const report: SyncReport = { mode, provider: provider.mode, done: true, startedAt: new Date(started).toISOString(), durationMs: 0, accounts: [], warnings: [] }
  const { accounts, warnings } = await ensureAccounts(payload, provider)
  report.warnings.push(...warnings)
  let didWork = false

  for (const account of accounts.filter((a) => !opts.accountEmail || a.email === opts.accountEmail.toLowerCase())) {
    const entry: SyncReport['accounts'][number] = { email: account.email, folders: [] }
    report.accounts.push(entry)
    await primeStates(payload, account.id)
    const lock = await getState(payload, account.id, null)
    if (!opts.force && lock.lockedUntil && new Date(lock.lockedUntil).getTime() > Date.now()) { entry.error = 'Another sync is already running for this mailbox.'; report.done = false; continue }
    await saveState(payload, lock.id, { lockedUntil: new Date(deadline + 30_000).toISOString() })
    try {
      const folders = await syncFolders(payload, provider, account)
      const order = ['inbox', 'sent', 'drafts', 'archive', 'spam', 'trash', 'custom']
      folders.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))
      for (const folder of folders) {
        const state = await getState(payload, account.id, folder)
        const imported = state.importStatus === 'complete'
        if (didWork && Date.now() > deadline && (!imported || mode === 'import')) { entry.folders.push({ name: folder.name, step: 'skipped', upserted: 0, inserted: 0, removed: 0 }); report.done = false; continue }
        if (mode === 'import' && imported) { entry.folders.push({ name: folder.name, step: 'complete', upserted: 0, inserted: 0, removed: 0 }); continue }
        if (!imported && mode !== 'incremental') {
          const r = await importFolderBatches(payload, provider, account, folder, deadline)
          didWork = true
          entry.folders.push({ name: folder.name, step: 'import', upserted: r.upserted, inserted: r.inserted, removed: 0 })
          if (!r.done) report.done = false
        } else if (imported && mode !== 'import') {
          const r = await incrementalFolder(payload, provider, account, folder)
          entry.folders.push({ name: folder.name, step: 'incremental', ...r })
        } else {
          entry.folders.push({ name: folder.name, step: 'skipped', upserted: 0, inserted: 0, removed: 0 })
        }
      }
      await saveState(payload, lock.id, { lastSyncedAt: new Date().toISOString(), lastError: null })
    } catch (error) {
      entry.error = error instanceof Error ? error.message : String(error)
      report.done = false
      await saveState(payload, lock.id, { lastError: entry.error })
    } finally {
      await saveState(payload, lock.id, { lockedUntil: null })
    }
  }
  report.durationMs = Date.now() - started
  return report
}

export type SyncStatus = {
  accounts: { id: number; email: string; zohoAccountId: string; imported: number; total: number; foldersComplete: number; foldersTotal: number; lastSyncedAt: string | null; lastError: string | null; running: boolean }[]
}

export async function getSyncStatus(payload: Payload): Promise<SyncStatus> {
  const accounts = (await payload.find({ collection: 'mail-accounts', limit: 20, depth: 0, pagination: false, overrideAccess: true })).docs as any[]
  const states = (await payload.find({ collection: 'mail-sync-state', limit: 500, depth: 0, pagination: false, overrideAccess: true })).docs as any[]
  return {
    accounts: accounts.map((a) => {
      const mine = states.filter((s) => (typeof s.account === 'object' ? s.account.id : s.account) === a.id)
      const folderStates = mine.filter((s) => s.zohoFolderId)
      const lock = mine.find((s) => !s.zohoFolderId)
      return {
        id: a.id, email: a.email, zohoAccountId: a.zohoAccountId ?? '',
        // A finished folder counts as fully imported (its stored count keeps tracking Zoho's total through the incremental sync).
        imported: folderStates.reduce((n, s) => n + (s.importStatus === 'complete' ? (s.totalCount ?? 0) : (s.importedCount ?? 0)), 0), total: folderStates.reduce((n, s) => n + (s.totalCount ?? 0), 0),
        foldersComplete: folderStates.filter((s) => s.importStatus === 'complete').length, foldersTotal: folderStates.length,
        lastSyncedAt: lock?.lastSyncedAt ?? null, lastError: lock?.lastError ?? folderStates.find((s) => s.lastError)?.lastError ?? null,
        running: Boolean(lock?.lockedUntil && new Date(lock.lockedUntil).getTime() > Date.now()),
      }
    }),
  }
}

export type { ProviderFolder }

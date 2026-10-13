/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs and raw rows are loosely typed here */
import { getPayload, type Payload } from 'payload'
import config from '../../../payload.config'
import { getMailProvider, isMockMode } from './index'
import type { MailAddress, MailProvider, MessageAction } from './types'

// Server helpers shared by the /api/mail/* routes. Every route calls requireMailAdmin first.

type Pool = { query: (text: string, values?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }> }
export const poolOf = (payload: Payload) => (payload.db as unknown as { pool: Pool }).pool

export async function requireMailAdmin(request: Request): Promise<{ payload: Payload } | { error: Response }> {
  const payload = await getPayload({ config })
  // Local development only: lets the UI be previewed without logging in. Never active in production builds (NODE_ENV).
  if (process.env.NODE_ENV === 'development' && process.env.MAIL_DEV_BYPASS_AUTH === 'true') return { payload }
  const { user } = await payload.auth({ headers: request.headers })
  if ((user as { role?: string } | null)?.role !== 'admin') return { error: Response.json({ error: 'Admins only.' }, { status: 403 }) }
  return { payload }
}

export async function providerContext(payload: Payload): Promise<{ provider: MailProvider; mock: boolean }> {
  return { provider: await getMailProvider(), mock: isMockMode() }
}

const addr = (v: unknown): MailAddress[] => (Array.isArray(v) ? (v as MailAddress[]) : [])

export function mapRow(r: any, withBody = false) {
  return {
    id: r.id as number,
    accountId: r.account_id as number,
    folderId: r.folder_id as number,
    folderType: r.folder_type as string,
    zohoMessageId: r.zoho_message_id as string,
    threadId: r.thread_id as string,
    from: { name: r.from_name ?? undefined, email: r.from_email ?? '' } as MailAddress,
    to: addr(r.to_addresses),
    cc: addr(r.cc_addresses),
    bcc: addr(r.bcc_addresses),
    subject: (r.subject as string) || '(no subject)',
    snippet: (r.snippet as string) ?? '',
    hasAttachments: Boolean(r.has_attachments),
    isRead: Boolean(r.is_read),
    isStarred: Boolean(r.is_starred),
    receivedAt: r.received_at ? new Date(r.received_at).toISOString() : null,
    ...(withBody ? { htmlBody: (r.html_body as string) ?? '', attachments: (r.attachments as any[]) ?? [] } : {}),
  }
}

const COLS = `m.id, m.account_id, m.folder_id, m.zoho_message_id, m.thread_id, m.from_name, m.from_email, m.to_addresses, m.cc_addresses, m.bcc_addresses, m.subject, m.snippet, m.has_attachments, m.is_read, m.is_starred, m.received_at, f.type as folder_type`

export type MessageQuery = {
  view?: 'folder' | 'all-inbox' | 'starred'
  accountId?: number
  folderId?: number
  threadId?: string
  q?: string
  from?: string
  to?: string
  subject?: string
  hasAttachment?: boolean
  unread?: boolean
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export async function queryMessages(payload: Payload, p: MessageQuery) {
  const where: string[] = ['a.active is not false']
  const vals: unknown[] = []
  const add = (sql: string, ...v: unknown[]) => {
    let s = sql
    for (const x of v) { vals.push(x); s = s.replace('?', `$${vals.length}`) }
    where.push(s)
  }
  const searching = Boolean(p.q || p.from || p.to || p.subject || p.hasAttachment || p.unread || p.dateFrom || p.dateTo)
  if (p.threadId) add('m.thread_id = ?', p.threadId)
  else if (p.folderId) add('m.folder_id = ?', p.folderId)
  else if (p.view === 'starred') where.push(`m.is_starred = true and f.type not in ('trash','spam')`)
  else if (p.view === 'all-inbox' && !searching) where.push(`f.type = 'inbox'`)
  if (searching && !p.folderId && !p.threadId) where.push(`f.type not in ('trash','spam')`)
  if (p.accountId) add('m.account_id = ?', p.accountId)
  const like = (s: string) => `%${s.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
  if (p.q) { vals.push(like(p.q)); const n = vals.length; where.push(`(m.subject ilike $${n} or m.snippet ilike $${n} or m.from_email ilike $${n} or m.from_name ilike $${n} or m.to_addresses::text ilike $${n})`) }
  if (p.from) { vals.push(like(p.from)); const n = vals.length; where.push(`(m.from_email ilike $${n} or m.from_name ilike $${n})`) }
  if (p.to) add('m.to_addresses::text ilike ?', like(p.to))
  if (p.subject) add('m.subject ilike ?', like(p.subject))
  if (p.hasAttachment) where.push('m.has_attachments = true')
  if (p.unread) where.push('m.is_read = false')
  if (p.dateFrom) add('m.received_at >= ?', p.dateFrom)
  if (p.dateTo) add('m.received_at <= ?', `${p.dateTo}T23:59:59Z`)
  const limit = Math.min(Math.max(p.limit ?? 50, 1), 200)
  const offset = Math.max((p.page ?? 1) - 1, 0) * limit
  const order = p.threadId ? 'm.received_at asc' : 'm.received_at desc'
  const rows = (await poolOf(payload).query(
    `select ${COLS} from payload.mail_messages m join payload.mail_folders f on f.id = m.folder_id join payload.mail_accounts a on a.id = m.account_id where ${where.join(' and ')} order by ${order} limit ${limit + 1} offset ${offset}`,
    vals,
  )).rows
  return { messages: rows.slice(0, limit).map((r) => mapRow(r)), hasMore: rows.length > limit }
}

export async function loadMessageRows(payload: Payload, ids: number[]) {
  if (!ids.length) return []
  return (await poolOf(payload).query(
    `select ${COLS}, m.html_body, m.attachments, a.zoho_account_id, f.zoho_folder_id, a.email as account_email from payload.mail_messages m join payload.mail_folders f on f.id = m.folder_id join payload.mail_accounts a on a.id = m.account_id where m.id = any($1::int[])`,
    [ids],
  )).rows
}

export async function folderCounts(payload: Payload) {
  const rows = (await poolOf(payload).query(`select folder_id, count(*)::int as total, count(*) filter (where is_read = false)::int as unread from payload.mail_messages group by folder_id`)).rows
  return new Map<number, { total: number; unread: number }>(rows.map((r) => [r.folder_id as number, { total: r.total as number, unread: r.unread as number }]))
}

/**
 * Apply an action in Zoho FIRST (Zoho is the source of truth), then mirror it in the local cache.
 * Rows are grouped per mailbox + folder because Zoho updates are scoped that way.
 */
export async function applyAction(payload: Payload, provider: MailProvider, ids: number[], action: MessageAction | { type: 'delete' }) {
  const rows = await loadMessageRows(payload, ids)
  const pool = poolOf(payload)
  const groups = new Map<string, any[]>()
  for (const r of rows) {
    const k = `${r.account_id}|${r.folder_id}`
    groups.set(k, [...(groups.get(k) ?? []), r])
  }
  for (const list of groups.values()) {
    const first = list[0]
    const zIds = list.map((r) => r.zoho_message_id as string)
    const dbIds = list.map((r) => r.id as number)
    const destFolder = async (type: string) => (await pool.query(`select id, zoho_folder_id from payload.mail_folders where account_id = $1 and type = $2 limit 1`, [first.account_id, type])).rows[0]
    if (action.type === 'delete') {
      await provider.deleteMessages(first.zoho_account_id, first.zoho_folder_id, zIds)
      if (first.folder_type === 'trash') await pool.query('delete from payload.mail_messages where id = any($1::int[])', [dbIds])
      else {
        const trash = await destFolder('trash')
        if (trash) await pool.query('update payload.mail_messages set folder_id = $2, updated_at = now() where id = any($1::int[])', [dbIds, trash.id])
        else await pool.query('delete from payload.mail_messages where id = any($1::int[])', [dbIds])
      }
      continue
    }
    if (action.type === 'move') {
      const dest = (await pool.query(`select id, zoho_folder_id from payload.mail_folders where account_id = $1 and zoho_folder_id = $2`, [first.account_id, action.destFolderId])).rows[0]
      if (!dest) throw new Error('Destination folder not found.')
      await provider.updateMessages(first.zoho_account_id, first.zoho_folder_id, zIds, action)
      await pool.query('update payload.mail_messages set folder_id = $2, updated_at = now() where id = any($1::int[])', [dbIds, dest.id])
      continue
    }
    await provider.updateMessages(first.zoho_account_id, first.zoho_folder_id, zIds, action)
    if (action.type === 'markRead') await pool.query('update payload.mail_messages set is_read = true, updated_at = now() where id = any($1::int[])', [dbIds])
    else if (action.type === 'markUnread') await pool.query('update payload.mail_messages set is_read = false, updated_at = now() where id = any($1::int[])', [dbIds])
    else if (action.type === 'star') await pool.query('update payload.mail_messages set is_starred = true, updated_at = now() where id = any($1::int[])', [dbIds])
    else if (action.type === 'unstar') await pool.query('update payload.mail_messages set is_starred = false, updated_at = now() where id = any($1::int[])', [dbIds])
    else if (action.type === 'archive' || action.type === 'spam') {
      const dest = await destFolder(action.type === 'archive' ? 'archive' : 'spam')
      if (dest) await pool.query('update payload.mail_messages set folder_id = $2, updated_at = now() where id = any($1::int[])', [dbIds, dest.id])
    }
  }
  return rows.length
}

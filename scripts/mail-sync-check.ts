/* eslint-disable @typescript-eslint/no-explicit-any -- check script */
// Exercises the mail import + two-way sync logic against the MOCK provider (no Zoho credentials needed).
//   PAYLOAD_DB_PUSH=true NODE_ENV=development npx tsx scripts/mail-sync-check.ts   (first run: also pushes the new tables)
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
process.env.MAIL_MOCK_MODE = 'true'
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { MockMailProvider } = await import('../src/lib/mail/mock-client')
const { runSync, getSyncStatus } = await import('../src/lib/mail/sync')
const payload = await getPayload({ config: cfg })
const mock = new MockMailProvider()
const pool = (payload.db as any).pool
const count = async (where = '1=1') => Number((await pool.query(`select count(*) from payload.mail_messages where ${where}`)).rows[0].count)

// 1) resumable import: tiny budget so it must stop and continue
let rounds = 0
for (;;) {
  const report = await runSync(payload, mock, { mode: 'import', budgetMs: 150, force: true })
  rounds += 1
  console.log('import round', rounds, 'done:', report.done, report.accounts.map((a) => `${a.email.split('@')[0]}:${a.folders.map((f) => `${f.name}=${f.upserted}`).join(',')}`).join(' | ').slice(0, 220))
  if (report.done || rounds > 60) break
}
console.log('messages in cache:', await count(), '| status:', JSON.stringify((await getSyncStatus(payload)).accounts.map((a) => `${a.email.split('@')[0]} ${a.imported}/${a.total}`)))

// 2) Zoho -> CMS: new mail, read in Zoho, deleted in Zoho
const newId = mock.simulateIncoming('100000002', 'Sync check: brand new mail')
const inbox = (await mock.listMessages('100000002', '100000002-inbox', { offset: 0, limit: 50 })).messages
const unread = inbox.find((m) => !m.isRead && m.zohoMessageId !== newId)!
await mock.updateMessages('100000002', unread.zohoFolderId, [unread.zohoMessageId], { type: 'markRead' })
const victim = inbox.filter((m) => m.zohoMessageId !== unread.zohoMessageId && m.zohoMessageId !== newId).at(-1)!
await mock.deleteMessages('100000002', victim.zohoFolderId, [victim.zohoMessageId])
await mock.deleteMessages('100000002', '100000002-trash', [victim.zohoMessageId]) // permanent
const inc = await runSync(payload, mock, { mode: 'incremental', budgetMs: 20000, force: true })
console.log('incremental:', inc.accounts.find((a) => a.email.startsWith('support'))!.folders.map((f) => `${f.name}: +${f.inserted} ~${f.upserted} -${f.removed}`).join(' | '))
const row = (await pool.query(`select is_read, folder_id from payload.mail_messages where message_key = $1`, [`100000002:${unread.zohoMessageId}`])).rows[0]
console.log('new mail cached:', (await count(`message_key = '100000002:${newId}'`)) === 1, '| read in Zoho -> cache:', row?.is_read === true, '| deleted in Zoho -> removed:', (await count(`message_key = '100000002:${victim.zohoMessageId}'`)) === 0)
process.exit(0)

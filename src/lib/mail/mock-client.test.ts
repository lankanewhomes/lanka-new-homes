import { describe, expect, it } from 'vitest'
import { MockMailProvider } from './mock-client'

describe('MockMailProvider', () => {
  const mail = new MockMailProvider()

  it('has three accounts with the standard folders (plus custom ones)', async () => {
    const accounts = await mail.listAccounts()
    expect(accounts.map((a) => a.email)).toEqual(['no-reply@lankanewhomes.com', 'support@lankanewhomes.com', 'developers@lankanewhomes.com'])
    for (const a of accounts) {
      const folders = await mail.listFolders(a.zohoAccountId)
      expect(folders.map((f) => f.type)).toEqual(expect.arrayContaining(['inbox', 'sent', 'drafts', 'spam', 'trash', 'archive']))
    }
    const dev = await mail.listFolders('100000003')
    expect(dev.filter((f) => f.type === 'custom').map((f) => f.name)).toEqual(['Invoices', 'Verified developers'])
  })

  it('pages a long folder newest first', async () => {
    const first = await mail.listMessages('100000001', '100000001-inbox', { offset: 0, limit: 100 })
    expect(first.messages).toHaveLength(100)
    expect(first.hasMore).toBe(true)
    expect(first.total).toBeGreaterThan(200)
    const times = first.messages.map((m) => m.receivedAt)
    expect([...times].sort().reverse()).toEqual(times)
    const last = await mail.listMessages('100000001', '100000001-inbox', { offset: 200, limit: 100 })
    expect(last.hasMore).toBe(false)
  })

  it('applies actions: read, star, move, delete, send, draft', async () => {
    const page = await mail.listMessages('100000002', '100000002-inbox', { offset: 0, limit: 50 })
    const target = page.messages.find((m) => !m.isRead)!
    await mail.updateMessages('100000002', target.zohoFolderId, [target.zohoMessageId], { type: 'markRead' })
    await mail.updateMessages('100000002', target.zohoFolderId, [target.zohoMessageId], { type: 'star' })
    const read = await mail.getMessage('100000002', target.zohoFolderId, target.zohoMessageId)
    expect(read?.isRead).toBe(true)
    expect(read?.isStarred).toBe(true)

    await mail.updateMessages('100000002', target.zohoFolderId, [target.zohoMessageId], { type: 'archive' })
    expect(await mail.getMessage('100000002', target.zohoFolderId, target.zohoMessageId)).toBeNull()
    expect((await mail.getMessage('100000002', '100000002-archive', target.zohoMessageId))?.subject).toBe(target.subject)

    await mail.deleteMessages('100000002', '100000002-archive', [target.zohoMessageId])
    expect(await mail.getMessage('100000002', '100000002-trash', target.zohoMessageId)).not.toBeNull()
    await mail.deleteMessages('100000002', '100000002-trash', [target.zohoMessageId])
    expect(await mail.getMessage('100000002', '100000002-trash', target.zohoMessageId)).toBeNull()

    const sent = await mail.sendMessage('100000002', { from: 'support@lankanewhomes.com', to: [{ email: 'a@b.com' }], subject: 'Hello', htmlBody: '<p>Hi</p>' })
    expect((await mail.getMessage('100000002', '100000002-sent', sent.zohoMessageId!))?.subject).toBe('Hello')
    const draft = await mail.saveDraft('100000002', { from: 'support@lankanewhomes.com', to: [], subject: 'Draft', htmlBody: '<p>x</p>' })
    const again = await mail.saveDraft('100000002', { from: 'support@lankanewhomes.com', to: [], subject: 'Draft 2', htmlBody: '<p>y</p>' }, draft.zohoMessageId)
    expect(again.zohoMessageId).toBe(draft.zohoMessageId)
  })

  it('returns attachment bytes', async () => {
    const page = await mail.listMessages('100000002', '100000002-inbox', { offset: 0, limit: 50 })
    const withFile = page.messages.find((m) => m.hasAttachments)!
    const full = await mail.getMessage('100000002', withFile.zohoFolderId, withFile.zohoMessageId)
    const file = await mail.getAttachment('100000002', withFile.zohoFolderId, withFile.zohoMessageId, full!.attachments[0].id)
    expect(file.filename).toBe(full!.attachments[0].filename)
    expect(file.bytes.length).toBeGreaterThan(0)
  })
})

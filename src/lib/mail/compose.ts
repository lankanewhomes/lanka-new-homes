/* eslint-disable @typescript-eslint/no-explicit-any -- request bodies are validated by hand */
import { after } from 'next/server'
import type { Payload } from 'payload'
import { applyAction, providerContext, loadMessageRows } from './server'
import { quickRefresh } from './sync'
import type { MailAddress, OutgoingMessage } from './types'

const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/
const clean = (list: unknown): MailAddress[] =>
  (Array.isArray(list) ? list : [])
    .map((a: any) => ({ name: typeof a?.name === 'string' && a.name.trim() ? a.name.trim() : undefined, email: String(a?.email ?? '').trim() }))
    .filter((a) => a.email)

/** Shared by /api/mail/send and /api/mail/save-draft. The mailbox is the "from" account; replies point at the message being answered. */
export async function runSendOrDraft(payload: Payload, request: Request, mode: 'send' | 'draft'): Promise<Response> {
  const body = (await request.json().catch(() => null)) as any
  if (!body) return Response.json({ error: 'Bad request.' }, { status: 400 })
  const account = (await payload.find({ collection: 'mail-accounts', where: { id: { equals: Number(body.accountId) } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] as any
  if (!account) return Response.json({ error: 'Choose a mailbox to send from.' }, { status: 400 })

  const to = clean(body.to)
  const cc = clean(body.cc)
  const bcc = clean(body.bcc)
  const bad = [...to, ...cc, ...bcc].find((a) => !EMAIL.test(a.email))
  if (bad) return Response.json({ error: `"${bad.email}" is not a valid email address.` }, { status: 400 })
  if (mode === 'send' && !to.length) return Response.json({ error: 'Add at least one recipient.' }, { status: 400 })

  let inReplyTo: OutgoingMessage['inReplyTo']
  if (body.inReplyToId && ['reply', 'replyAll', 'forward'].includes(body.replyMode)) {
    const parent = (await loadMessageRows(payload, [Number(body.inReplyToId)]))[0]
    if (parent) inReplyTo = { zohoFolderId: parent.zoho_folder_id, zohoMessageId: parent.zoho_message_id, mode: body.replyMode }
  }

  const message: OutgoingMessage = {
    from: account.email,
    to, cc, bcc,
    subject: String(body.subject ?? '').slice(0, 998),
    htmlBody: String(body.htmlBody ?? ''),
    attachments: Array.isArray(body.attachments)
      ? body.attachments.map((a: any) => ({ filename: String(a.filename), contentType: String(a.contentType || 'application/octet-stream'), contentBase64: String(a.contentBase64) }))
      : [],
    inReplyTo,
  }

  try {
    const { provider } = await providerContext(payload)
    if (mode === 'draft') {
      const existing = body.draftId ? (await loadMessageRows(payload, [Number(body.draftId)]))[0] : undefined
      const saved = await provider.saveDraft(account.zohoAccountId, message, existing?.zoho_message_id)
      await quickRefresh(payload, provider, account.id, ['drafts'])
      const row = (await import('./server')).poolOf(payload)
      const found = (await row.query('select id from payload.mail_messages where message_key = $1', [`${account.zohoAccountId}:${saved.zohoMessageId}`])).rows[0]
      return Response.json({ ok: true, draftId: found?.id ?? null })
    }
    await provider.sendMessage(account.zohoAccountId, message)
    // A draft that was being edited is removed once it is sent (Trash first, then permanently), like Gmail.
    if (body.draftId) {
      const draftId = Number(body.draftId)
      await applyAction(payload, provider, [draftId], { type: 'delete' }).catch(() => undefined)
      await applyAction(payload, provider, [draftId], { type: 'delete' }).catch(() => undefined)
    }
    // The draft this message came from (if any) is gone once it is sent; a reply may also have changed the original.
    await quickRefresh(payload, provider, account.id, ['sent'])
    after(() => quickRefresh(payload, provider, account.id, ['drafts', 'inbox']).catch(() => undefined))
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Could not send the message.' }, { status: 502 })
  }
}

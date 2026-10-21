'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useDocumentInfo } from '@payloadcms/ui'
import { HtmlBody } from '@/components/mail/HtmlBody'

// "Emails" tab on a developer: every email we sent them and every reply they sent back, from all our mailboxes (read from the
// synced Zoho cache) plus every automatic email the platform sent them (lead alerts, Verified Developer, invites, reports; the Email
// log). Click a row to read it here.

type Row = { id: number; subject: string; snippet: string; receivedAt: string | null; direction: 'sent' | 'received'; accountEmail: string; from: { name?: string; email: string }; to: { name?: string; email: string }[] }
type Full = { htmlBody: string }
const LOG_BASE = 1_000_000_000 // email-log rows get ids above this so they never clash with mail-sync ids

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '')

export function DeveloperEmails() {
  const { id } = useDocumentInfo()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [info, setInfo] = useState<{ addresses: string[]; domains: string[] }>({ addresses: [], domains: [] })
  const [error, setError] = useState('')
  const [open, setOpen] = useState<number | null>(null)
  const [bodies, setBodies] = useState<Record<number, Full | string>>({})

  useEffect(() => {
    if (!id) return
    let alive = true
    Promise.all([
      fetch(`/api/mail/developer-emails?developerId=${id}`, { credentials: 'include' }).then((r) => r.json()).catch(() => ({ messages: [], addresses: [], domains: [] })),
      fetch(`/payload-api/email-log?where[developer][equals]=${id}&sort=-sentAt&limit=200&depth=0`, { credentials: 'include' }).then((r) => r.json()).catch(() => ({ docs: [] })),
    ])
      .then(([j, log]) => {
        if (!alive) return
        if (j.error && !(log.docs ?? []).length) { setError(j.error); return }
        const logged: Row[] = (log.docs ?? []).map((d: { id: number; subject: string; sentAt: string; fromEmail?: string; toEmail?: string; kind?: string; htmlBody?: string; textBody?: string; clickCount?: number; clicks?: { button?: string }[] }) => ({
          id: LOG_BASE + d.id, subject: d.subject, snippet: `${d.kind ? `Automatic email: ${d.kind}` : 'Automatic email'}${d.clickCount ? ` · clicked: ${[...new Set((d.clicks ?? []).map((c) => c.button || 'Link'))].join(', ')}` : ''}`, receivedAt: d.sentAt, direction: 'sent' as const,
          accountEmail: 'LankaNewHomes (automatic)', from: { email: d.fromEmail ?? '' }, to: String(d.toEmail ?? '').split(',').map((e) => ({ email: e.trim() })).filter((t) => t.email),
        }))
        const bodies0: Record<number, Full | string> = {}
        for (const d of log.docs ?? []) bodies0[LOG_BASE + d.id] = { htmlBody: d.htmlBody || `<pre style="white-space:pre-wrap;font-family:inherit">${String(d.textBody ?? '').replace(/</g, '&lt;')}</pre>` }
        setBodies((b) => ({ ...bodies0, ...b }))
        const all = [...(j.messages ?? []), ...logged].sort((a: Row, b: Row) => String(b.receivedAt ?? '').localeCompare(String(a.receivedAt ?? '')))
        setRows(all)
        setInfo({ addresses: j.addresses ?? [], domains: j.domains ?? [] })
      })
      .catch(() => alive && setError('Could not load the emails.'))
    return () => {
      alive = false
    }
  }, [id])

  const toggle = (rowId: number) => {
    setOpen(open === rowId ? null : rowId)
    if (bodies[rowId] || rowId >= LOG_BASE) return
    fetch(`/api/mail/message/${rowId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => setBodies((b) => ({ ...b, [rowId]: j.message ?? j.error ?? 'Could not load the message.' })))
      .catch(() => setBodies((b) => ({ ...b, [rowId]: 'Could not load the message.' })))
  }

  if (!id) return <p className="ln-mail-empty">Save the developer first, then their emails appear here.</p>
  if (error) return <p className="ln-mail-empty">{error}</p>
  if (!rows) return <p className="ln-mail-empty">Loading emails…</p>
  const sent = rows.filter((r) => r.direction === 'sent').length

  return (
    <div className="ln-dev-mail">
      <div className="ln-dev-mail-top">
        <div><strong>{sent}</strong><span>we sent</span></div>
        <div><strong>{rows.length - sent}</strong><span>they sent back</span></div>
        <p>Matched on {[...info.addresses, ...info.domains.map((d) => `@${d}`)].join(', ') || 'no addresses yet (add a contact email on the Profile tab)'}. Open <Link href="/cms/mail">Mail</Link> to reply.</p>
      </div>
      {rows.length === 0 ? <p className="ln-mail-empty">No emails with this developer yet.</p> : null}
      {rows.map((r) => {
        const body = bodies[r.id]
        return (
          <div key={r.id} className={`ln-dev-mail-row ${r.direction}`}>
            <button type="button" onClick={() => toggle(r.id)}>
              <span className="ln-dev-mail-tag">{r.direction === 'sent' ? 'We sent' : 'They sent'}</span>
              <span className="ln-dev-mail-main">
                <b>{r.subject}</b>
                <i>{r.direction === 'sent' ? `from ${r.accountEmail} to ${r.to.map((t) => t.email).join(', ')}` : `${r.from.name ? r.from.name + ' · ' : ''}${r.from.email} to ${r.accountEmail}`}</i>
                {open === r.id ? null : <em>{r.snippet}</em>}
              </span>
              <span className="ln-dev-mail-date">{when(r.receivedAt)}</span>
            </button>
            {open === r.id ? (
              <div className="ln-dev-mail-body">{!body ? 'Loading…' : typeof body === 'string' ? body : <HtmlBody html={body.htmlBody} />}</div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

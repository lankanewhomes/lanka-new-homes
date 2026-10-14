'use client'

import { useEffect, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { HtmlBody } from '@/components/mail/HtmlBody'

// "Emails" tab on a developer: every email we sent them and every reply they sent back, from all our mailboxes (read from the
// synced Zoho cache). Click a row to read it here. UI-only: nothing is stored on the developer.

type Row = { id: number; subject: string; snippet: string; receivedAt: string | null; direction: 'sent' | 'received'; accountEmail: string; from: { name?: string; email: string }; to: { name?: string; email: string }[] }
type Full = { htmlBody: string }

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
    fetch(`/api/mail/developer-emails?developerId=${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return
        if (j.error) setError(j.error)
        else {
          setRows(j.messages)
          setInfo({ addresses: j.addresses, domains: j.domains })
        }
      })
      .catch(() => alive && setError('Could not load the emails.'))
    return () => {
      alive = false
    }
  }, [id])

  const toggle = (rowId: number) => {
    setOpen(open === rowId ? null : rowId)
    if (bodies[rowId]) return
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
        <p>Matched on {[...info.addresses, ...info.domains.map((d) => `@${d}`)].join(', ') || 'no addresses yet (add a contact email on the Profile tab)'}. Open <a href="/cms/mail">Mail</a> to reply.</p>
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

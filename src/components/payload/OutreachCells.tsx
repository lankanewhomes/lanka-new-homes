'use client'

import Link from 'next/link'

// Outreach log list cells (owner, 2026-10-12): the company with who it went to, a coloured status pill, and a click count.
type Row = Record<string, unknown>
type CellProps = { cellData?: unknown; rowData?: Row }

const text = (v: unknown) => (typeof v === 'string' ? v : '')

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  draft: { label: 'Draft', bg: '#eceae4', fg: '#55534e' },
  sent: { label: 'Sent', bg: '#dbeafe', fg: '#1d4ed8' },
  clicked: { label: 'Clicked', bg: '#dcfce7', fg: '#15803d' },
  replied: { label: 'Replied', bg: '#ede9fe', fg: '#6d28d9' },
  no_reply: { label: 'No reply', bg: '#fee2e2', fg: '#b91c1c' },
}

export function OutreachCompanyCell({ cellData, rowData }: CellProps) {
  const row = rowData ?? {}
  const name = text(cellData) || text(row.recipient) || 'Untitled email'
  return (
    <Link href={`/cms/collections/outreach/${row.id}`} style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit' }}>
      <strong>{name}</strong>
      {text(row.recipient) ? <small style={{ opacity: 0.7 }}>{text(row.recipient)}</small> : null}
    </Link>
  )
}

export function OutreachStatusCell({ cellData }: CellProps) {
  const s = STATUS[text(cellData)] ?? STATUS.draft
  return <span style={{ background: s.bg, color: s.fg, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{s.label}</span>
}

export function OutreachClicksCell({ cellData, rowData }: CellProps) {
  const n = typeof cellData === 'number' ? cellData : 0
  if (!n) return <span style={{ opacity: 0.5 }}>No clicks yet</span>
  const last = text((rowData ?? {}).lastClickedAt)
  return (
    <span>
      <strong>{n}</strong> click{n === 1 ? '' : 's'}
      {last ? <small style={{ display: 'block', opacity: 0.7 }}>last {new Date(last).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small> : null}
    </span>
  )
}

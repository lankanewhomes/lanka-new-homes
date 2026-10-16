'use client'

import { useEffect, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

// "Activity" tab on a project or land: what happened to this listing and who did it, newest first. UI-only: reads /developer-activity.
type Row = { id: number; title: string; detail?: string | null; actor?: string | null; at: string }
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })

export function ActivityTimeline() {
  const { id, collectionSlug } = useDocumentInfo()
  const [rows, setRows] = useState<Row[] | null>(null)
  useEffect(() => {
    if (!id) return
    const field = collectionSlug === 'lands' ? 'landId' : 'projectId'
    let alive = true
    fetch(`/payload-api/developer-activity?where[${field}][equals]=${id}&sort=-at&limit=200&depth=0`, { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => alive && setRows(Array.isArray(j.docs) ? j.docs : []))
      .catch(() => alive && setRows([]))
    return () => {
      alive = false
    }
  }, [id, collectionSlug])
  if (!id) return <p>Save first, then the activity appears here.</p>
  if (rows === null) return null
  return (
    <div className="ln-done-todos">
      <p className="ln-done-todos-title">Activity <span>({rows.length})</span></p>
      {rows.length === 0 ? <p>Nothing recorded yet. Changes from now on are listed here.</p> : null}
      {rows.map((r) => (
        <p key={r.id}>
          <strong>{r.title}</strong> · {when(r.at)}
          {r.actor ? ` · ${r.actor}` : ''}
          {r.detail ? <><br />{r.detail}</> : null}
        </p>
      ))}
    </div>
  )
}

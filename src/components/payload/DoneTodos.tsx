'use client'

import { useEffect, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

// "Done tasks" on a project, land or developer page: every to-do that was ticked off for this record. They are hidden from the
// To-do list on purpose (owner, 2026-10-14) but kept here so they can be looked up later. UI-only: reads /listing-todos, stores nothing.

type Todo = { id: number; title: string; doneAt?: string | null; updatedAt?: string; sourceLinks?: string | null }

const WHERE: Record<string, string> = { projects: 'project', lands: 'land' }

export function DoneTodos() {
  const { id, collectionSlug, initialData } = useDocumentInfo()
  const [rows, setRows] = useState<Todo[] | null>(null)
  const name = (initialData as { name?: string; title?: string } | undefined)?.name ?? (initialData as { title?: string } | undefined)?.title

  useEffect(() => {
    if (!id) return
    const field = collectionSlug ? WHERE[collectionSlug] : undefined
    if (!field && collectionSlug !== 'developers') return
    if (!field && !name) return
    const params = new URLSearchParams({ limit: '100', sort: '-doneAt', depth: '0', 'where[done][equals]': 'true' })
    if (field) params.set(`where[${field}][equals]`, String(id))
    else params.set('where[listingName][equals]', String(name))
    let alive = true
    fetch(`/payload-api/listing-todos?${params}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => alive && setRows(Array.isArray(j.docs) ? j.docs : []))
      .catch(() => alive && setRows([]))
    return () => {
      alive = false
    }
  }, [id, collectionSlug, name])

  if (!id || rows === null) return null
  return (
    <div className="ln-done-todos">
      <p className="ln-done-todos-title">Done tasks <span>({rows.length})</span></p>
      {rows.length === 0 ? (
        <p className="ln-done-todos-empty">Nothing ticked off yet. Done tasks leave the To-do list and show up here.</p>
      ) : (
        <ul>
          {rows.map((t) => (
            <li key={t.id}>
              <span className="ln-done-todos-tick" aria-hidden="true">✓</span>
              <span className="ln-done-todos-text">{t.title}</span>
              {(t.sourceLinks ?? '').split(/\s+/).filter((u) => /^https?:\/\//i.test(u)).map((u, i) => (
                <a key={i} href={u} target="_blank" rel="noopener noreferrer">{new URL(u).hostname.replace(/^www\./, '')}</a>
              ))}
              <time>{(t.doneAt ?? t.updatedAt) ? new Date((t.doneAt ?? t.updatedAt) as string).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</time>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

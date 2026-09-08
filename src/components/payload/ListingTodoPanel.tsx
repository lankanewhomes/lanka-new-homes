'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { ListingTodoResponse, ListingTodoRow } from '@/collections/endpoints/listing-todo'

// "Finish your listings" — sits on the /cms dashboard (beforeDashboard,
// after DashboardHeading). One card per project the developer owns, least
// complete first: the score, and each unfinished check as a to-do with the
// ranking bump it earns. Data from /payload-api/listing-todo (scoped
// server-side to the developer's own projects; admins see everything).

const MAX_ITEMS_PER_PROJECT = 6

function ScoreBar({ score }: { score: number }) {
  const color = score >= 90 ? 'var(--theme-success-500)' : score >= 60 ? '#f47b36' : 'var(--theme-error-500)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
      <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--theme-elevation-150)', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, transition: 'width 300ms' }} />
      </div>
      <strong style={{ fontSize: 13, minWidth: 34, textAlign: 'right' }}>{score}%</strong>
    </div>
  )
}

function ProjectCard({ row, rankingPoints, scorePoints }: { row: ListingTodoRow; rankingPoints: number; scorePoints: number }) {
  const [showAll, setShowAll] = useState(false)
  const items = showAll ? row.missing : row.missing.slice(0, MAX_ITEMS_PER_PROJECT)
  const hidden = row.missing.length - items.length
  const editHref = `/cms/collections/projects/${row.id}`

  return (
    <div style={{ border: '1px solid var(--theme-elevation-150)', borderRadius: 6, background: 'var(--theme-elevation-0)', padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href={editHref} style={{ fontWeight: 700, fontSize: 15 }}>{row.name || 'Untitled project'}</Link>
          {!row.isPublished ? <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--theme-elevation-100)', opacity: 0.8 }}>Unpublished</span> : null}
        </div>
        <ScoreBar score={row.score} />
      </div>

      {row.missing.length === 0 ? (
        <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--theme-success-500)' }}>Complete — every check passes.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'grid', gap: 6 }}>
          {items.map((item) => (
            <li key={item.key} style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 13 }}>
              <span aria-hidden="true" style={{ display: 'inline-block', width: 14, height: 14, border: '1.5px solid var(--theme-elevation-400)', borderRadius: 3, flexShrink: 0, position: 'relative', top: 2 }} />
              <span style={{ flex: 1 }}>
                <Link href={editHref} style={{ fontWeight: 600 }}>{item.label}</Link>
                <span style={{ opacity: 0.6 }}> — {item.hint}</span>
              </span>
              <span style={{ whiteSpace: 'nowrap', fontSize: 12, color: '#f47b36', fontWeight: 700 }}>+{scorePoints} score · +{rankingPoints} rank</span>
            </li>
          ))}
        </ul>
      )}
      {hidden > 0 ? (
        <button type="button" onClick={() => setShowAll(true)} style={{ marginTop: 8, fontSize: 12, background: 'none', border: 0, padding: 0, color: 'var(--theme-elevation-600)', cursor: 'pointer', textDecoration: 'underline' }}>
          Show {hidden} more
        </button>
      ) : null}
    </div>
  )
}

export function ListingTodoPanel() {
  const [data, setData] = useState<ListingTodoResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/payload-api/listing-todo', { credentials: 'include', signal: controller.signal })
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body?.error ?? 'Failed to load listing to-dos.')
        setData(body as ListingTodoResponse)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message ?? 'Failed to load listing to-dos.')
      })
    return () => controller.abort()
  }, [])

  if (error) return null
  if (!data || data.projects.length === 0) return null

  const incomplete = data.projects.filter((row) => row.missing.length > 0)
  const totalMissing = incomplete.reduce((sum, row) => sum + row.missing.length, 0)

  return (
    <section style={{ padding: '0 32px 24px' }} aria-label="Finish your listings">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Finish your listings</h2>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.7 }}>
          {totalMissing === 0
            ? 'Everything is filled in.'
            : `${totalMissing} item${totalMissing === 1 ? '' : 's'} to fill in — each one adds ${data.scorePointsPerItem} to the completeness score and about ${data.rankingPointsPerItem} ranking points.`}
        </p>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {data.projects.map((row) => (
          <ProjectCard key={row.id} row={row} rankingPoints={data.rankingPointsPerItem} scorePoints={data.scorePointsPerItem} />
        ))}
      </div>
    </section>
  )
}

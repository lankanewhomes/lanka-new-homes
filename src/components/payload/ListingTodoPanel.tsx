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
// Admins see every listing on the platform, so show only the least complete few until asked.
const COLLAPSED_PROJECTS = 5

function ScoreBar({ score }: { score: number }) {
  const color = score >= 90 ? '#14602a' : score >= 60 ? '#111111' : '#c4560a'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
      <div style={{ flex: 1, height: 8, border: '1px solid #111111', background: '#ffffff', overflow: 'hidden' }}>
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
    <div style={{ border: '1px solid #111111', background: '#ffffff', padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href={editHref} style={{ fontWeight: 700, fontSize: 15 }}>{row.name || 'Untitled project'}</Link>
          {!row.isPublished ? <span style={{ fontSize: 11, padding: '2px 8px', border: '1px solid #111111', background: '#ffffff' }}>Unpublished</span> : null}
        </div>
        <ScoreBar score={row.score} />
      </div>

      {row.missing.length === 0 ? (
        <p style={{ margin: '10px 0 0', fontSize: 13, color: '#14602a' }}>Complete — every check passes.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'grid', gap: 6 }}>
          {items.map((item) => (
            <li key={item.key} style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 13 }}>
              <span aria-hidden="true" style={{ display: 'inline-block', width: 14, height: 14, border: '1.5px solid #111111', flexShrink: 0, position: 'relative', top: 2 }} />
              <span style={{ flex: 1 }}>
                <Link href={editHref} style={{ fontWeight: 600 }}>{item.label}</Link>
                <span style={{ opacity: 0.6 }}> — {item.hint}</span>
              </span>
              <span style={{ whiteSpace: 'nowrap', fontSize: 12, color: '#111111', fontWeight: 700 }}>+{scorePoints} score · +{rankingPoints} rank</span>
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
  const [showAllProjects, setShowAllProjects] = useState(false)

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
  // Least complete first (the endpoint sorts that way); finished listings go last and stay hidden while collapsed.
  const ordered = [...incomplete, ...data.projects.filter((row) => row.missing.length === 0)]
  const visible = showAllProjects ? ordered : ordered.slice(0, COLLAPSED_PROJECTS)
  const hiddenProjects = ordered.length - visible.length

  return (
    <section style={{ padding: '0 32px 24px' }} aria-label="Finish your listings">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Finish your listings</h2>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.7 }}>
          {totalMissing === 0
            ? 'Everything is filled in.'
            : `${incomplete.length} of ${data.projects.length} listing${data.projects.length === 1 ? '' : 's'} incomplete · ${totalMissing} item${totalMissing === 1 ? '' : 's'} to fill in — each one adds ${data.scorePointsPerItem} to the completeness score and about ${data.rankingPointsPerItem} ranking points.`}
        </p>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {visible.map((row) => (
          <ProjectCard key={row.id} row={row} rankingPoints={data.rankingPointsPerItem} scorePoints={data.scorePointsPerItem} />
        ))}
      </div>
      {hiddenProjects > 0 ? (
        <button type="button" onClick={() => setShowAllProjects(true)} style={{ marginTop: 12, padding: '8px 14px', border: '1px solid #111111', background: '#ffffff', color: '#111111', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          Show all {ordered.length} listings ({hiddenProjects} more)
        </button>
      ) : showAllProjects && ordered.length > COLLAPSED_PROJECTS ? (
        <button type="button" onClick={() => setShowAllProjects(false)} style={{ marginTop: 12, padding: '8px 14px', border: '1px solid #111111', background: '#ffffff', color: '#111111', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          Show fewer
        </button>
      ) : null}
    </section>
  )
}

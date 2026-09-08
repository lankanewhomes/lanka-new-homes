'use client'

import { useMemo, useState } from 'react'
import { useAllFormFields } from '@payloadcms/ui'
import { reduceFieldsToValues } from 'payload/shared'
import { computeCompleteness, RANKING_POINTS_PER_ITEM, SCORE_POINTS_PER_ITEM, type CompletenessData } from '@/lib/completeness'

// Top of the project form: the completeness score as a to-do list, computed
// live from the form's current values (the same checks the beforeChange
// hook scores on save — src/lib/completeness.ts). "Add per-plan prices",
// "Add the move-in year", … each with the score and ranking points it earns.

export function CompletenessTodo() {
  const [fields] = useAllFormFields()
  const [showDone, setShowDone] = useState(false)
  const data = useMemo(() => reduceFieldsToValues(fields, true) as CompletenessData, [fields])
  const { score, items, missing } = useMemo(() => computeCompleteness(data), [data])
  const done = items.filter((item) => item.done)
  const color = score >= 90 ? 'var(--theme-success-500)' : score >= 60 ? '#f47b36' : 'var(--theme-error-500)'

  return (
    <div className="field-type completeness-todo" style={{ border: '1px solid var(--theme-elevation-150)', borderRadius: 6, padding: '14px 16px', marginBottom: 24, background: 'var(--theme-elevation-0)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <strong style={{ fontSize: 15 }}>Listing completeness</strong>
          <p style={{ margin: '2px 0 0', fontSize: 12, opacity: 0.7 }}>
            {missing.length === 0
              ? 'Every check passes — this listing ranks as high as completeness allows.'
              : `${missing.length} to fill in. Each one adds ${SCORE_POINTS_PER_ITEM} to this score and about ${RANKING_POINTS_PER_ITEM} ranking points on the site.`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 200 }}>
          <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--theme-elevation-150)', overflow: 'hidden' }}>
            <div style={{ width: `${score}%`, height: '100%', background: color, transition: 'width 300ms' }} />
          </div>
          <strong style={{ fontSize: 14, minWidth: 40, textAlign: 'right' }}>{score}%</strong>
        </div>
      </div>

      {missing.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {missing.map((item) => (
            <li key={item.key} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 13 }}>
              <span aria-hidden="true" style={{ display: 'inline-block', width: 13, height: 13, border: '1.5px solid var(--theme-elevation-400)', borderRadius: 3, flexShrink: 0, position: 'relative', top: 2 }} />
              <span>
                <span style={{ fontWeight: 600 }}>{item.label}</span>
                <span style={{ opacity: 0.6 }}> — {item.hint}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {done.length > 0 ? (
        <div style={{ marginTop: 10 }}>
          <button type="button" onClick={() => setShowDone((v) => !v)} style={{ fontSize: 12, background: 'none', border: 0, padding: 0, color: 'var(--theme-elevation-600)', cursor: 'pointer', textDecoration: 'underline' }}>
            {showDone ? 'Hide' : 'Show'} {done.length} completed
          </button>
          {showDone ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'grid', gap: 4, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', opacity: 0.65 }}>
              {done.map((item) => (
                <li key={item.key} style={{ fontSize: 12 }}>✓ {item.label}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

'use client'

import { useFormFields } from '@payloadcms/ui'

// Summary header at the top of a developer's page: three big numbers in a tinted box, then a grid of smaller facts —
// all read from what is already on the form (nothing is fetched or saved here).

const num = (value: unknown): string => (typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString() : typeof value === 'string' && value.trim() ? value : '—')
const label = (value: unknown, fallback = '—'): string => (typeof value === 'string' && value ? value.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : fallback)

export function DeveloperOverviewStats() {
  const f = useFormFields(([fields]) => fields)
  const value = (path: string) => f?.[path]?.value

  const big = [
    { value: num(value('activeProjects')), label: 'Active projects' },
    { value: num(value('completedProjects')), label: 'Completed projects' },
    { value: num(value('yearsInBusiness')), label: 'Years in business' },
  ]
  const rate = value('response_stats.within_hour_rate')
  const median = value('response_stats.median_minutes')
  const small = [
    { value: label(value('plan'), 'Free'), label: 'Plan' },
    { value: label(value('verification_status'), 'Pending'), label: 'Verification' },
    { value: value('domain_verified') ? 'Yes' : 'No', label: 'Verified Developer badge' },
    { value: typeof rate === 'number' ? `${rate}%` : '—', label: 'Leads answered within 24 hours' },
    { value: typeof median === 'number' ? `${median} min` : '—', label: 'Median first response' },
    { value: num(value('establishedYear')), label: 'Established' },
  ]

  return (
    <div className="ln-devstats">
      <div className="ln-devstats-big">
        {big.map((item) => (
          <div key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div className="ln-devstats-small">
        {small.map((item) => (
          <div key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

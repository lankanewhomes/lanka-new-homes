'use client'

import Link from 'next/link'

// List-view cells for Projects and Lands: a photo thumbnail with the name, and a completeness bar.
// Rendered by Payload in the collection tables (admin.components.Cell on the name/title and score fields).

type Row = Record<string, unknown>
type CellProps = { cellData?: unknown; rowData?: Row; collectionSlug?: string }

const text = (value: unknown) => (typeof value === 'string' ? value : '')

function developerName(row: Row): string {
  const dev = row.developer as { name?: string } | string | number | null | undefined
  return dev && typeof dev === 'object' ? text(dev.name) : ''
}

function Thumb({ src, alt }: { src: string; alt: string }) {
  // Plain <img>: admin chrome, remote R2 photo, no need for the site's image optimiser here.
  /* eslint-disable-next-line @next/next/no-img-element */
  return src ? <img src={src} alt={alt} className="ln-cell-thumb" loading="lazy" /> : <span className="ln-cell-thumb ln-cell-thumb-empty" aria-hidden="true" />
}

function NameCell({ cellData, rowData, collectionSlug, subtitle }: CellProps & { subtitle: string }) {
  const row = rowData ?? {}
  const name = text(cellData) || 'Untitled'
  return (
    <Link href={`/cms/collections/${collectionSlug}/${row.id}`} className="ln-cell-name">
      <Thumb src={text(row.heroImage)} alt="" />
      <span className="ln-cell-name-text">
        <strong>{name}</strong>
        {subtitle ? <small>{subtitle}</small> : null}
      </span>
    </Link>
  )
}

export function ProjectNameCell(props: CellProps) {
  const row = props.rowData ?? {}
  const place = text(row.location) || text(row.city)
  return <NameCell {...props} collectionSlug={props.collectionSlug ?? 'projects'} subtitle={[developerName(row), place].filter(Boolean).join(' · ')} />
}

export function LandNameCell(props: CellProps) {
  const row = props.rowData ?? {}
  return <NameCell {...props} collectionSlug={props.collectionSlug ?? 'lands'} subtitle={[text(row.sellerName), text(row.location)].filter(Boolean).join(' · ')} />
}

function Bar({ score }: { score: number }) {
  const value = Math.max(0, Math.min(100, Math.round(score)))
  const color = value >= 90 ? '#14602a' : value >= 60 ? '#1d4f8f' : value >= 35 ? '#c98a00' : '#a3261b'
  return (
    <span className="ln-cell-bar" title={`${value}% complete`}>
      <span className="ln-cell-bar-track"><span style={{ width: `${value}%`, background: color }} /></span>
      <strong>{value}%</strong>
    </span>
  )
}

// Projects store their own completeness_score (set on every save by the scoring hook).
export function ProjectCompletenessCell({ cellData }: CellProps) {
  return <Bar score={typeof cellData === 'number' ? cellData : 0} />
}

// Lands have no stored score, so count how many key facts a land listing has filled in.
export function LandCompletenessCell({ rowData }: CellProps) {
  const row = rowData ?? {}
  const filled = (value: unknown) => (typeof value === 'number' ? value > 0 : typeof value === 'string' ? value.trim().length > 0 : Array.isArray(value) ? value.length > 0 : Boolean(value))
  const checks = [
    filled(row.heroImage),
    filled(row.location),
    filled(row.district),
    filled(row.priceLkr) || filled(row.pricePerPerchLkrMin),
    filled(row.landSizePerches) || filled(row.landSizeAcres),
    filled(row.landUse),
    filled(row.summary) || filled(row.description),
    filled(row.status),
    filled(row.sellerName),
    filled(row.plotCount) || filled(row.plots),
  ]
  return <Bar score={(checks.filter(Boolean).length / checks.length) * 100} />
}

// The Lands "completeness" column is a UI-only field; it draws nothing on the edit form.
export function LandCompletenessField() {
  return null
}

// ---- Company directories (Developers, Construction / Marketing / Sales companies, Architects, Interior designers) ----
// Logo + name, with website and place underneath; and a profile-completeness bar from the basic profile fields.

const hostOf = (value: unknown) => text(value).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')

export function CompanyNameCell(props: CellProps) {
  const row = props.rowData ?? {}
  const logo = text(row.logo)
  const name = text(props.cellData) || 'Untitled'
  const subtitle = [hostOf(row.website), text(row.location)].filter(Boolean).join(' · ')
  return (
    <Link href={`/cms/collections/${props.collectionSlug}/${row.id}`} className="ln-cell-name">
      {logo ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={logo} alt="" className="ln-cell-thumb ln-cell-logo" loading="lazy" />
      ) : (
        <span className="ln-cell-thumb ln-cell-logo ln-cell-logo-empty" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
      )}
      <span className="ln-cell-name-text">
        <strong>{name}</strong>
        {subtitle ? <small>{subtitle}</small> : null}
      </span>
    </Link>
  )
}

export function CompanyCompletenessCell({ rowData }: CellProps) {
  const row = rowData ?? {}
  const filled = (value: unknown) => (typeof value === 'string' ? value.trim().length > 0 : Boolean(value))
  const checks = [filled(row.logo), filled(row.description), filled(row.contact_email), filled(row.contact_phone), filled(row.website), filled(row.location)]
  return <Bar score={(checks.filter(Boolean).length / checks.length) * 100} />
}

// ---- Developer list cells ----
const STATUS_BADGE: Record<string, string> = { pending: 'ln-badge-warning', approved: 'ln-badge-success', rejected: 'ln-badge-danger', changes_requested: 'ln-badge-info' }
const STATUS_LABEL: Record<string, string> = { pending: 'Waiting for review', approved: 'Approved', rejected: 'Rejected', changes_requested: 'Changes requested' }

// Email over phone, in one cell.
export function ContactCell({ cellData, rowData }: CellProps) {
  const row = rowData ?? {}
  const email = text(cellData) || text(row.contact_email)
  const phone = text(row.contact_phone)
  if (!email && !phone) return <span className="ln-cell-muted">—</span>
  return (
    <span className="ln-cell-stack">
      <strong>{email || '—'}</strong>
      <small>{phone || 'No phone'}</small>
    </span>
  )
}

// Review status badge, plus a "Verified Developer" badge when the company has earned it.
export function DeveloperStatusCell({ cellData, rowData }: CellProps) {
  const row = rowData ?? {}
  const status = text(cellData) || 'pending'
  return (
    <span className="ln-cell-badges">
      <span className={`ln-badge ${STATUS_BADGE[status] ?? 'ln-badge-neutral'}`}>{STATUS_LABEL[status] ?? status}</span>
      {row.domain_verified ? <span className="ln-badge ln-badge-success">Verified Developer</span> : null}
    </span>
  )
}

export function PlanCell({ cellData }: CellProps) {
  const plan = text(cellData) || 'free'
  return <span className={`ln-badge ${plan === 'free' ? 'ln-badge-neutral' : 'ln-badge-info'}`}>{plan.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase())}</span>
}

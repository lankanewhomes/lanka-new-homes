import type { Payload, Where } from 'payload'

// Summary strip above the company directory lists (Developers, Construction / Marketing / Sales companies, Architects,
// Interior designers): how many there are and what is missing. Read-only counts; shown through
// admin.components.beforeList.

type Props = { collectionSlug?: string; payload?: Payload; user?: { role?: string } | null }

const empty = (field: string): Where => ({ or: [{ [field]: { exists: false } }, { [field]: { equals: '' } }] })

async function loadCounts(payload: Payload, collectionSlug: string) {
  try {
    const slug = collectionSlug as 'developers'
    const count = (where?: Where) => payload.count({ collection: slug, where, overrideAccess: true }).then((r) => r.totalDocs)
    const isDevelopers = collectionSlug === 'developers'
    const [total, noLogo, noEmail, noPhone, verified, pending] = await Promise.all([
      count(),
      count(empty('logo')),
      count(empty('contact_email')),
      count(empty('contact_phone')),
      isDevelopers ? count({ domain_verified: { equals: true } }) : Promise.resolve(0),
      isDevelopers ? count({ verification_status: { equals: 'pending' } }) : Promise.resolve(0),
    ])
    return { total, noLogo, noEmail, noPhone, verified, pending, isDevelopers }
  } catch {
    return null // never block a list over a summary
  }
}

export async function CompanyListSummary({ collectionSlug, payload, user }: Props) {
  // Platform-wide counts: admins only.
  if (!collectionSlug || !payload || user?.role !== 'admin') return null
  const counts = await loadCounts(payload, collectionSlug)
  if (!counts) return null
  const { total, noLogo, noEmail, noPhone, verified, pending, isDevelopers } = counts

  const tiles = [
    { value: total, label: 'In the directory' },
    { value: total - noLogo, label: 'With a logo' },
    { value: Math.max(0, total - Math.max(noEmail, noPhone)), label: 'With email and phone' },
    ...(isDevelopers ? [{ value: verified, label: 'Verified Developers' }, { value: pending, label: 'Waiting for review' }] : [{ value: noLogo, label: 'Still need a logo' }]),
  ]
  return (
    <div className="ln-listsum">
      {tiles.map((tile) => (
        <div key={tile.label}>
          <strong>{tile.value.toLocaleString()}</strong>
          <span>{tile.label}</span>
        </div>
      ))}
    </div>
  )
}

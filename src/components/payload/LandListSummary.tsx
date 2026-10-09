import type { Payload, Where } from 'payload'

// Summary strip for the Land list: how many listings, how many are available, and what is still missing.
// Counts respect the viewer's own access (admins see everything).

type Props = { payload?: Payload; user?: unknown }

const empty = (field: string): Where => ({ or: [{ [field]: { exists: false } }, { [field]: { equals: '' } }] })

async function loadCounts(payload: Payload, user: unknown) {
  try {
    const count = (where?: Where) => payload.count({ collection: 'lands', where, overrideAccess: false, user: user as never }).then((r) => r.totalDocs)
    const [total, available, noPhoto, noPrice] = await Promise.all([
      count(),
      count({ status: { equals: 'Available' } }),
      count(empty('heroImage')),
      count({ or: [{ priceLkr: { exists: false } }, { priceLkr: { equals: 0 } }] }),
    ])
    return { total, available, noPhoto, noPrice }
  } catch {
    return null // never block a list over a summary
  }
}

export async function LandListSummary({ payload, user }: Props) {
  if (!payload || !user) return null
  const counts = await loadCounts(payload, user)
  if (!counts) return null
  const tiles = [
    { value: counts.total, label: 'Land listings' },
    { value: counts.available, label: 'Available' },
    { value: counts.total - counts.noPhoto, label: 'With a photo' },
    { value: counts.total - counts.noPrice, label: 'With a price' },
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

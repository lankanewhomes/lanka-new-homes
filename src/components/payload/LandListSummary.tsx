import type { Payload, Where } from 'payload'

// Summary strip for the Land list: how many listings, how many are available, and what is still missing.
// Counts respect the viewer's own access (admins see everything).

type Props = { payload?: Payload; user?: unknown }

const empty = (field: string): Where => ({ or: [{ [field]: { exists: false } }, { [field]: { equals: '' } }] })

// Total plots across all land listings — same rule as the homepage's "Land Plots" number: the plots listed one by one, or
// the developer-published plot count where a land has no rows. Loading every plot row is the heavy part, so it is cached
// for a minute.
let plotCache: { at: number; value: number } | null = null

async function countPlots(payload: Payload, user: unknown): Promise<number> {
  if (plotCache && Date.now() - plotCache.at < 60_000) return plotCache.value
  const res = await payload.find({ collection: 'lands', limit: 1000, depth: 0, pagination: false, select: { plotCount: true, plots: true }, overrideAccess: false, user: user as never })
  const value = res.docs.reduce((total, land) => {
    const rows = Array.isArray((land as { plots?: unknown[] }).plots) ? (land as { plots: unknown[] }).plots.length : 0
    const published = typeof (land as { plotCount?: number }).plotCount === 'number' ? (land as { plotCount: number }).plotCount : 0
    return total + (rows || published)
  }, 0)
  plotCache = { at: Date.now(), value }
  return value
}

async function loadCounts(payload: Payload, user: unknown) {
  try {
    const count = (where?: Where) => payload.count({ collection: 'lands', where, overrideAccess: false, user: user as never }).then((r) => r.totalDocs)
    const [total, available, noPhoto, noPrice, plots] = await Promise.all([
      count(),
      count({ status: { equals: 'Available' } }),
      count(empty('heroImage')),
      count({ or: [{ priceLkr: { exists: false } }, { priceLkr: { equals: 0 } }] }),
      countPlots(payload, user),
    ])
    return { total, available, noPhoto, noPrice, plots }
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
    { value: counts.plots, label: 'Plots in total' },
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

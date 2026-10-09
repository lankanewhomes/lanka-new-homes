import type { Payload, Where } from 'payload'
import { ListTabs, type ListTabItem } from './ListTabs'

// Media library header: tabs (All / Images / Videos / PDFs, with counts) and a summary strip (files, total size, images
// still missing alt text). Counts respect the viewer's own access.

type Props = { payload?: Payload; user?: unknown }

async function load(payload: Payload, user: unknown) {
  try {
    const count = (where?: Where) => payload.count({ collection: 'media', where, overrideAccess: false, user: user as never }).then((r) => r.totalDocs)
    const [all, images, videos, pdfs, noAlt, sizes] = await Promise.all([
      count(),
      count({ mimeType: { like: 'image/' } }),
      count({ mimeType: { like: 'video/' } }),
      count({ mimeType: { like: 'application/pdf' } }),
      count({ and: [{ mimeType: { like: 'image/' } }, { or: [{ alt: { exists: false } }, { alt: { equals: '' } }] }] }),
      payload.find({ collection: 'media', limit: 2000, depth: 0, select: { filesize: true }, overrideAccess: false, user: user as never }),
    ])
    const bytes = sizes.docs.reduce((sum, doc) => sum + (typeof doc.filesize === 'number' ? doc.filesize : 0), 0)
    return { all, images, videos, pdfs, noAlt, bytes }
  } catch {
    return null // never block the library over its header
  }
}

export async function MediaListTabs({ payload, user }: Props) {
  if (!payload || !user) return null
  const d = await load(payload, user)
  if (!d) return null
  const base = '/cms/collections/media'
  const items: ListTabItem[] = [
    { label: 'All', count: d.all, href: base },
    { label: 'Images', count: d.images, href: `${base}?where[mimeType][like]=image/`, query: 'where[mimeType][like]=image/' },
    { label: 'Videos', count: d.videos, href: `${base}?where[mimeType][like]=video/`, query: 'where[mimeType][like]=video/' },
    { label: 'PDFs', count: d.pdfs, href: `${base}?where[mimeType][like]=application/pdf`, query: 'where[mimeType][like]=application/pdf' },
  ]
  const mb = d.bytes / 1048576
  const tiles = [
    { value: d.all.toLocaleString(), label: 'Files' },
    { value: mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`, label: 'Total size' },
    { value: d.images.toLocaleString(), label: 'Images' },
    { value: d.noAlt.toLocaleString(), label: 'Images missing alt text' },
  ]
  return (
    <>
      <ListTabs items={items} />
      <div className="ln-listsum">
        {tiles.map((tile) => (
          <div key={tile.label}>
            <strong>{tile.value}</strong>
            <span>{tile.label}</span>
          </div>
        ))}
      </div>
    </>
  )
}

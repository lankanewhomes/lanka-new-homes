import type { CollectionSlug, Payload, Where } from 'payload'
import { ListTabs, type ListTabItem } from './ListTabs'

// Generic tabs-with-counts above a list, one tab per value of a select field (e.g. Leads: All / New / Contacted / Site visit /
// Closed). Used through admin.components.beforeListTable with clientProps { field, values }.

type Props = { payload?: Payload; collectionSlug?: string; field?: string; values?: { label: string; value: string }[]; user?: unknown }

async function loadItems({ payload, collectionSlug, field, values, user }: Required<Props>): Promise<ListTabItem[] | null> {
  try {
    const slug = collectionSlug as CollectionSlug
    const count = (where?: Where) => payload.count({ collection: slug, where, overrideAccess: false, user: user as never }).then((r) => r.totalDocs)
    const [all, ...counts] = await Promise.all([count(), ...values.map((v) => count({ [field]: { equals: v.value } }))])
    const base = `/cms/collections/${collectionSlug}`
    return [
      { label: 'All', count: all, href: base },
      ...values.map((v, i) => ({ label: v.label, count: counts[i], href: `${base}?where[${field}][equals]=${v.value}`, query: `where[${field}][equals]=${v.value}` })),
    ]
  } catch {
    return null // never block a list over its tabs
  }
}

export async function CollectionStatusTabs({ payload, collectionSlug, field, values, user }: Props) {
  if (!payload || !collectionSlug || !field || !values || !user) return null
  const items = await loadItems({ payload, collectionSlug, field, values, user })
  return items ? <ListTabs items={items} /> : null
}

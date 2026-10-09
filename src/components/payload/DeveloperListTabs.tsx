import type { Payload, Where } from 'payload'
import { ListTabs, type ListTabItem } from './ListTabs'

// Tabs above the Developers list: All / Verified / Waiting for review / Approved / Rejected, each with its count.

async function loadItems(payload: Payload): Promise<ListTabItem[] | null> {
  try {
    const count = (where?: Where) => payload.count({ collection: 'developers', where, overrideAccess: true }).then((r) => r.totalDocs)
    const base = '/cms/collections/developers'
    const [all, verified, pending, approved, rejected] = await Promise.all([
      count(),
      count({ domain_verified: { equals: true } }),
      count({ verification_status: { equals: 'pending' } }),
      count({ verification_status: { equals: 'approved' } }),
      count({ verification_status: { equals: 'rejected' } }),
    ])
    return [
      { label: 'All', count: all, href: base },
      { label: 'Verified', count: verified, href: `${base}?where[domain_verified][equals]=true`, query: 'where[domain_verified][equals]=true' },
      { label: 'Waiting for review', count: pending, href: `${base}?where[verification_status][equals]=pending`, query: 'where[verification_status][equals]=pending' },
      { label: 'Approved', count: approved, href: `${base}?where[verification_status][equals]=approved`, query: 'where[verification_status][equals]=approved' },
      { label: 'Rejected', count: rejected, href: `${base}?where[verification_status][equals]=rejected`, query: 'where[verification_status][equals]=rejected' },
    ]
  } catch {
    return null // never block a list over its tabs
  }
}

export async function DeveloperListTabs({ payload, user }: { payload?: Payload; user?: { role?: string } | null }) {
  // Platform-wide counts: admins only.
  if (!payload || user?.role !== 'admin') return null
  const items = await loadItems(payload)
  return items ? <ListTabs items={items} /> : null
}

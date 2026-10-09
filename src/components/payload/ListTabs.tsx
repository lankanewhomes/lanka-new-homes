'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

// Pill tabs with counts above a list ("All 18 · Verified 0 · Pending 17 …"). Each tab links to the same list with a
// filter; the one matching the current address is highlighted.

export type ListTabItem = { label: string; count: number; href: string; query?: string }

export function ListTabs({ items }: { items: ListTabItem[] }) {
  const params = useSearchParams()
  const current = items.find((item) => item.query && params?.toString().includes(encodeURI(item.query)) ) ?? items.find((item) => item.query && decodeURIComponent(params?.toString() ?? '').includes(item.query))
  const active = current ?? items[0]
  return (
    <div className="ln-listtabs" role="tablist">
      {items.map((item) => (
        <Link key={item.label} href={item.href} role="tab" aria-selected={item === active} className={`ln-listtab${item === active ? ' is-active' : ''}`}>
          {item.label}
          <span>{item.count}</span>
        </Link>
      ))}
    </div>
  )
}

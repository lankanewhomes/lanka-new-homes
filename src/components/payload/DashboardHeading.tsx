import type { AdminViewServerProps } from 'payload'

// Registered via payload.config.ts's admin.components.beforeDashboard —
// renders above the default collection-cards grid on /cms's dashboard view
// only (not every page, unlike TopRightAccountMenu's header slot). Server
// component: `user` arrives as a prop here, no client-side fetch needed.
// Purely a "which mode am I in" label — an admin sees everything regardless,
// a developer's own scoped nav (hiddenUnlessAdmin, baseListFilter) already
// does the real work of narrowing what they see.
export function DashboardHeading({ user }: AdminViewServerProps) {
  const role = (user as { role?: string } | null)?.role
  const label = role === 'admin' ? 'Admin Dashboard' : role === 'developer' ? 'Developer Dashboard' : null
  if (!label) return null

  return (
    <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700 }}>{label}</h1>
  )
}

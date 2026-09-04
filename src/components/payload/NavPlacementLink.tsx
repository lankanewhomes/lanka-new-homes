import Link from 'next/link'
import type { AdminViewServerProps } from 'payload'

// Registered via payload.config.ts's admin.components.afterNavLinks — shows
// right below the collection nav groups on every /cms page. Developer-only:
// an admin manages placements directly through Payments/Placement Pricing
// already in their nav, they don't need the guided picker.
export function NavPlacementLink({ user }: AdminViewServerProps) {
  const role = (user as { role?: string } | null)?.role
  if (role !== 'developer') return null

  return (
    <div style={{ padding: '16px 20px 8px' }}>
      <Link
        href="/cms/placements"
        style={{
          display: 'block',
          padding: '10px 14px',
          borderRadius: 6,
          border: '1px solid #f47b36',
          background: 'rgba(244, 123, 54, 0.08)',
          color: 'inherit',
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        ✨ Get Featured
      </Link>
    </div>
  )
}

import type { AdminViewServerProps } from 'payload'
import { MailApp } from '@/components/mail/MailApp'

// Registered in payload.config.ts admin.components.views.mail (path /mail → /cms/mail). Admin-only; the /api/mail/* routes
// check the role again on the server, this just keeps the screen from rendering for anyone else.
export function MailView({ initPageResult }: AdminViewServerProps) {
  const role = (initPageResult?.req?.user as { role?: string } | null)?.role
  if (role !== 'admin') return <p style={{ padding: 24 }}>The mail client is for admins only.</p>
  return <MailApp />
}

import type { AdminViewServerProps } from 'payload'
import { MailSettings } from '@/components/mail/MailSettings'

// /cms/mail/settings: connection status, env keys, import and sync progress. Admin only.
export function MailSettingsView({ initPageResult }: AdminViewServerProps) {
  const role = (initPageResult?.req?.user as { role?: string } | null)?.role
  if (role !== 'admin') return <p style={{ padding: 24 }}>The mail settings are for admins only.</p>
  return <MailSettings />
}

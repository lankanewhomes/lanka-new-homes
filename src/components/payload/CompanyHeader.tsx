import type { UIFieldServerProps } from 'payload'
import Link from 'next/link'
import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react'

// Top of a company profile page (Architects, Construction / Marketing / Sales companies, Interior designers): logo or
// initial, name, contact chips, how complete the profile is, and a "Visit website" button. Server component, UI-only —
// reads the document, saves nothing. Sits above the tab bar.

type Props = UIFieldServerProps & { id?: number | string; data?: Record<string, unknown> }
const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export async function CompanyHeader({ id, data }: Props) {
  if (!id) return null // "create" screen
  const name = str(data?.name) || 'Company'
  const logo = str(data?.logo)
  const website = str(data?.website)
  const site = website && !/^https?:\/\//.test(website) ? `https://${website}` : website
  const checks = [logo, str(data?.description), str(data?.contact_email), str(data?.contact_phone), website, str(data?.location)]
  const percent = Math.round((checks.filter(Boolean).length / checks.length) * 100)

  return (
    <div className="ln-devhero ln-devhero-top">
      <div className="ln-devhero-head">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin chrome, remote logo
          <img src={logo} alt="" className="ln-devhero-logo" />
        ) : (
          <span className="ln-devhero-logo ln-devhero-logo-empty">{name.slice(0, 1).toUpperCase()}</span>
        )}
        <div className="ln-devhero-title">
          <h2>{name}</h2>
          <div className="ln-devhero-chips">
            {str(data?.contact_email) ? <span className="ln-badge ln-badge-neutral"><Mail size={12} style={{ marginRight: 5 }} />{str(data?.contact_email)}</span> : null}
            {str(data?.contact_phone) ? <span className="ln-badge ln-badge-neutral"><Phone size={12} style={{ marginRight: 5 }} />{str(data?.contact_phone)}</span> : null}
            {str(data?.location) ? <span className="ln-badge ln-badge-neutral"><MapPin size={12} style={{ marginRight: 5 }} />{str(data?.location)}</span> : null}
            <span className={`ln-badge ${percent >= 90 ? 'ln-badge-success' : percent >= 60 ? 'ln-badge-info' : 'ln-badge-warning'}`}>Profile {percent}% complete</span>
          </div>
        </div>
        <div className="ln-devhero-actions">
          {site ? <Link href={site} target="_blank" className="ln-quick-action"><ExternalLink size={15} /> Visit website</Link> : null}
        </div>
      </div>
    </div>
  )
}

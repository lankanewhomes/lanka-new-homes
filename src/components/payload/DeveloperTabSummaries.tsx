'use client'

import { useFormFields } from '@payloadcms/ui'

// Status summaries at the top of the Leads & response and Verification tabs (UI-only: read the form, save nothing).

function useValue() {
  const f = useFormFields(([fields]) => fields)
  return (path: string) => f?.[path]?.value
}

const dateText = (value: unknown) => {
  if (typeof value !== 'string' || !value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

export function LeadsSummary() {
  const v = useValue()
  const alertsOn = v('lead_alerts.enabled') !== false
  const earned = v('response_stats.responds_within_hour') === true
  const rate = v('response_stats.within_hour_rate')
  const median = v('response_stats.median_minutes')
  const judged = v('response_stats.sample_size')
  const alertEmail = (typeof v('lead_alerts.email') === 'string' && (v('lead_alerts.email') as string)) || (typeof v('contact_email') === 'string' && (v('contact_email') as string)) || ''
  const alertWa = typeof v('lead_alerts.whatsapp') === 'string' ? (v('lead_alerts.whatsapp') as string) : ''

  return (
    <div className="ln-tabsum">
      <div className="ln-tabsum-top">
        <div>
          <p className="ln-tabsum-kicker">Instant lead alerts</p>
          <p className="ln-tabsum-title">
            {alertsOn ? 'On' : 'Off'}
            <span className={`ln-badge ${alertsOn ? 'ln-badge-success' : 'ln-badge-danger'}`}>{alertsOn ? 'Sending' : 'Paused'}</span>
          </p>
          <p className="ln-tabsum-sub">Email: {alertEmail || 'not set'}{alertWa ? ` · WhatsApp: ${alertWa}` : ''}</p>
        </div>
        <div>
          <p className="ln-tabsum-kicker">“Responds within 24 hours” badge</p>
          <p className="ln-tabsum-title">
            {earned ? 'Earned' : 'Not earned yet'}
            <span className={`ln-badge ${earned ? 'ln-badge-success' : 'ln-badge-neutral'}`}>{earned ? 'Showing' : 'Hidden'}</span>
          </p>
          <p className="ln-tabsum-sub">Needs 5+ leads in 90 days and 80% answered within 24 hours.</p>
        </div>
      </div>
      <div className="ln-tabsum-tiles">
        <div><strong>{typeof rate === 'number' ? `${rate}%` : '—'}</strong><span>Answered within 24 hours</span></div>
        <div><strong>{typeof median === 'number' ? `${median} min` : '—'}</strong><span>Median first response</span></div>
        <div><strong>{typeof judged === 'number' ? judged : '—'}</strong><span>Leads judged (90 days)</span></div>
        <div><strong>{dateText(v('response_stats.computed_at'))}</strong><span>Last calculated</span></div>
      </div>
    </div>
  )
}

export function VerifySummary() {
  const v = useValue()
  const verified = v('domain_verified') === true
  const status = typeof v('verification_status') === 'string' ? (v('verification_status') as string) : 'pending'
  const extras = Array.isArray(v('extra_email_domains')) ? (v('extra_email_domains') as string[]) : []

  return (
    <div className="ln-tabsum">
      <div className="ln-tabsum-top">
        <div>
          <p className="ln-tabsum-kicker">Verified Developer badge</p>
          <p className="ln-tabsum-title">
            {verified ? 'Verified' : 'Not verified'}
            <span className={`ln-badge ${verified ? 'ln-badge-success' : 'ln-badge-warning'}`}>{verified ? 'Badge showing' : 'No badge'}</span>
          </p>
          <p className="ln-tabsum-sub">Earned when the company confirms an email on its own website domain. An admin can also switch it on or off.</p>
        </div>
        <div>
          <p className="ln-tabsum-kicker">Review status</p>
          <p className="ln-tabsum-title">
            {status.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())}
            <span className={`ln-badge ${status === 'approved' ? 'ln-badge-success' : status === 'rejected' ? 'ln-badge-danger' : 'ln-badge-warning'}`}>{status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Needs a decision'}</span>
          </p>
          <p className="ln-tabsum-sub">New self-registered developers start as pending until approved.</p>
        </div>
      </div>
      <div className="ln-tabsum-tiles">
        <div><strong>{(v('verified_domain') as string) || '—'}</strong><span>Verified domain</span></div>
        <div><strong>{(v('verified_email') as string) || '—'}</strong><span>Verified email</span></div>
        <div><strong>{dateText(v('verified_at'))}</strong><span>Verified on</span></div>
        <div><strong>{extras.length ? extras.join(', ') : 'None'}</strong><span>Extra approved email domains</span></div>
      </div>
    </div>
  )
}

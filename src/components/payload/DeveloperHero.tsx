import type { UIFieldServerProps } from 'payload'
import Link from 'next/link'
import { ExternalLink, MessageCircle, Plus } from 'lucide-react'
import { getPackage } from '@/lib/packages'

// Developer page, two UI-only server components (nothing is saved):
//  • DeveloperHeader — logo, name, status chips, quick actions. Sits ABOVE the tab bar.
//  • DeveloperSummary — summary box (listings / leads / views, last 28 days), recent leads and side cards.
//    Sits INSIDE the Overview tab, so the tab bar stays right under the header.
// Read-only queries scoped to this developer's own projects.

const LEAD_BADGE: Record<string, string> = { new: 'ln-badge-info', contacted: 'ln-badge-warning', site_visit: 'ln-badge-success', closed: 'ln-badge-neutral' }
const LEAD_LABEL: Record<string, string> = { new: 'New', contacted: 'Contacted', site_visit: 'Site visit', closed: 'Closed' }
const pretty = (value: unknown, fallback = '—') => (typeof value === 'string' && value ? value.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : fallback)

type Props = UIFieldServerProps & { id?: number | string; data?: Record<string, unknown> }

async function loadSummaryData(payload: UIFieldServerProps['payload'], id: number | string) {
  try {
    const since = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
    const projectsRes = await payload.find({ collection: 'projects', where: { developer: { equals: id } }, limit: 200, depth: 0, sort: '-updatedAt', select: { name: true, slug: true, isPublished: true, updatedAt: true }, overrideAccess: true })
    const projectIds = projectsRes.docs.map((p) => p.id)
    const none = [-1]
    const inProjects = { project: { in: projectIds.length ? projectIds : none } }

    const [leadsRes, newLeads, views] = await Promise.all([
      payload.find({ collection: 'leads', where: inProjects, sort: '-createdAt', limit: 6, depth: 0, select: { name: true, email: true, status: true, project: true, createdAt: true }, overrideAccess: true }),
      payload.count({ collection: 'leads', where: { ...inProjects, status: { equals: 'new' } }, overrideAccess: true }),
      payload.count({ collection: 'analytics', where: { and: [inProjects, { event_type: { equals: 'view' } }, { timestamp: { greater_than: since } }] }, overrideAccess: true }),
    ])

    const published = projectsRes.docs.filter((p) => p.isPublished !== false).length
    return { projectsRes, leadsRes, newLeads, views, published }
  } catch {
    return null // never block the form over a summary
  }
}

export async function DeveloperHeader(props: Props) {
  const { id, data } = props
  if (!id) return null // "create" screen — nothing to show yet

  const name = String(data?.name ?? 'Developer')
  const slug = String(data?.slug ?? '')
  const logo = typeof data?.logo === 'string' ? data.logo : ''
  const plan = getPackage(data?.plan as never)

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
            <span className="ln-badge ln-badge-neutral">Plan: {plan?.name ?? pretty(data?.plan, 'Free')}</span>
            <span className={`ln-badge ${data?.domain_verified ? 'ln-badge-success' : 'ln-badge-warning'}`}>{data?.domain_verified ? 'Verified Developer' : 'Not verified yet'}</span>
            <span className="ln-badge ln-badge-neutral">Review: {pretty(data?.verification_status, 'Pending')}</span>
          </div>
        </div>
        <div className="ln-devhero-actions">
          {slug ? <Link href={`/developers/${slug}`} target="_blank" className="ln-quick-action"><ExternalLink size={15} /> View public page</Link> : null}
          <Link href="/cms/collections/projects/create" className="ln-quick-action"><Plus size={15} /> Add project</Link>
        </div>
      </div>
    </div>
  )
}

export async function DeveloperSummary(props: Props) {
  const { id, payload, data } = props
  if (!id || !payload) return null

  const loaded = await loadSummaryData(payload, id)
  if (!loaded) return null
  const { projectsRes, leadsRes, newLeads, views, published } = loaded

  const plan = getPackage(data?.plan as never)
  const nameOf = new Map(projectsRes.docs.map((p) => [p.id, String(p.name ?? 'Untitled')]))
  const big = [
    { value: projectsRes.totalDocs.toLocaleString(), label: `Listings (${published} published)` },
    { value: leadsRes.totalDocs.toLocaleString(), label: `Leads (${newLeads.totalDocs} new)` },
    { value: views.totalDocs.toLocaleString(), label: 'Listing views, last 28 days' },
  ]

  return (
    <div className="ln-devhero">
      <div className="ln-devhero-grid">
        <div className="ln-devhero-main">
          <div className="ln-devstats-big">
            {big.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="ln-dash-section-head" style={{ marginTop: 18 }}>
            <h2>Recent leads</h2>
            <Link href="/cms/collections/leads">View all</Link>
          </div>
          {leadsRes.docs.length === 0 ? (
            <div className="ln-empty">No leads for this developer yet.</div>
          ) : (
            <table className="ln-table">
              <thead>
                <tr><th>Name</th><th>Project</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {leadsRes.docs.map((lead) => (
                  <tr key={lead.id}>
                    <td><Link href={`/cms/collections/leads/${lead.id}`}>{lead.name}</Link></td>
                    <td>{nameOf.get(lead.project as number) ?? '—'}</td>
                    <td><span className={`ln-badge ${LEAD_BADGE[lead.status as string] ?? 'ln-badge-neutral'}`}>{LEAD_LABEL[lead.status as string] ?? String(lead.status)}</span></td>
                    <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside className="ln-devhero-side">
          <div className="ln-side-card">
            <p className="ln-side-card-title">Current plan</p>
            <p className="ln-side-card-big">{plan?.name ?? pretty(data?.plan, 'Free')}</p>
            <p className="ln-side-card-text">Want more visibility? Featured plans put this developer&apos;s listings higher and on the homepage.</p>
            <Link href="/cms/billing" className="ln-side-card-btn">Manage billing</Link>
          </div>

          <div className="ln-side-card">
            <p className="ln-side-card-title">Projects</p>
            {projectsRes.docs.length === 0 ? <p className="ln-side-card-text">No projects yet.</p> : null}
            <ul className="ln-side-list">
              {projectsRes.docs.slice(0, 6).map((project) => (
                <li key={project.id}>
                  <Link href={`/cms/collections/projects/${project.id}`}>{String(project.name ?? 'Untitled')}</Link>
                  <small>{project.isPublished === false ? 'Draft' : 'Published'}</small>
                </li>
              ))}
            </ul>
            {projectsRes.totalDocs > 6 ? <Link href="/cms/collections/projects" className="ln-side-more">See all {projectsRes.totalDocs}</Link> : null}
          </div>

          <div className="ln-side-card">
            <p className="ln-side-card-title"><MessageCircle size={14} style={{ verticalAlign: '-2px' }} /> Lead alerts</p>
            <p className="ln-side-card-text">Instant email alerts for new enquiries are set up under the &ldquo;Leads &amp; response&rdquo; tab.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}

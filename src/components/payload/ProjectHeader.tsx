import type { UIFieldServerProps } from 'payload'
import Link from 'next/link'
import { ExternalLink, UserRound } from 'lucide-react'

// Top of a Project (or Land) edit page: cover photo, name, status chips, completeness, and quick links. Server component,
// UI-only — reads the document, saves nothing. Sits above the section menu.

type Props = UIFieldServerProps & { id?: number | string; data?: Record<string, unknown>; collectionSlug?: string }
const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

async function developerOf(payload: UIFieldServerProps['payload'], value: unknown): Promise<{ id: number | string; name: string } | null> {
  try {
    const id = value && typeof value === 'object' && 'id' in value ? (value as { id: number | string }).id : (value as number | string | null)
    if (!id) return null
    if (value && typeof value === 'object' && 'name' in value) return { id, name: str((value as { name?: unknown }).name) }
    const dev = await payload.findByID({ collection: 'developers', id, depth: 0, select: { name: true }, overrideAccess: true })
    return { id, name: str(dev.name) }
  } catch {
    return null // never block the form over a header
  }
}

export async function ProjectHeader({ id, data, payload, collectionSlug }: Props) {
  if (!id) return null // "create" screen
  const isLand = collectionSlug === 'lands'
  const name = str(data?.name) || str(data?.title) || (isLand ? 'Land listing' : 'Project')
  const slug = str(data?.slug)
  const photo = str(data?.heroImage)
  const status = str(data?.status)
  const published = data?.isPublished !== false
  const score = typeof data?.completeness_score === 'number' ? data.completeness_score : null
  const plan = str(data?.package)
  const place = str(data?.location) || str(data?.city)
  const developer = isLand ? null : await developerOf(payload, data?.developer)
  const publicHref = slug ? `${isLand ? '/land' : '/projects'}/${slug}` : ''

  return (
    <div className="ln-phead">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin chrome, remote photo
        <img src={photo} alt="" className="ln-phead-photo" />
      ) : (
        <span className="ln-phead-photo ln-phead-photo-empty">{name.slice(0, 1).toUpperCase()}</span>
      )}
      <div className="ln-phead-main">
        <h2>{name}</h2>
        <p className="ln-phead-sub">
          {[place, developer?.name ? `by ${developer.name}` : ''].filter(Boolean).join(' · ') || (isLand ? 'Land listing' : 'Project')}
        </p>
        <div className="ln-devhero-chips">
          {status ? <span className="ln-badge ln-badge-info">{status}</span> : null}
          <span className={`ln-badge ${published ? 'ln-badge-success' : 'ln-badge-warning'}`}>{published ? 'Published' : 'Draft'}</span>
          {plan ? <span className="ln-badge ln-badge-neutral">Plan: {plan.replace(/-/g, ' ')}</span> : null}
          {score !== null ? <span className={`ln-badge ${score >= 90 ? 'ln-badge-success' : score >= 60 ? 'ln-badge-info' : 'ln-badge-warning'}`}>{score}% complete</span> : null}
        </div>
      </div>
      <div className="ln-devhero-actions">
        {publicHref ? <Link href={publicHref} target="_blank" className="ln-quick-action"><ExternalLink size={15} /> View on the site</Link> : null}
        {developer ? <Link href={`/cms/collections/developers/${developer.id}`} className="ln-quick-action"><UserRound size={15} /> Developer</Link> : null}
      </div>
    </div>
  )
}

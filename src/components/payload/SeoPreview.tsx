'use client'

import { useFormFields } from '@payloadcms/ui'

// Live preview at the top of every SEO section (Projects, Land, Developers, Neighborhoods): how the page may look in
// Google and when shared, with title/description length guides. Reads what is typed on the form; saves nothing.

const TITLE_MAX = 60
const DESC_MAX = 160
const SITE = 'https://www.lankanewhomes.com'

function Counter({ length, max, label }: { length: number; max: number; label: string }) {
  const state = length === 0 ? 'empty' : length > max ? 'over' : length > max * 0.85 ? 'near' : 'good'
  return (
    <span className={`ln-seo-count is-${state}`}>
      {label}: {length}/{max}
    </span>
  )
}

export function SeoPreview() {
  const f = useFormFields(([fields]) => fields)
  const text = (path: string) => {
    const value = f?.[path]?.value
    return typeof value === 'string' ? value.trim() : ''
  }
  const pageName = text('name') || text('title')
  const title = text('seo.seoTitle') || pageName || 'Page title'
  const description = text('seo.seoDescription')
  const canonical = text('seo.canonicalUrl')
  const image = text('seo.ogImage')
  const noIndex = f?.['seo.noIndex']?.value === true
  const shownUrl = canonical || `${SITE}/…`

  return (
    <div className="ln-seo">
      <div className="ln-seo-card">
        <p className="ln-seo-label">How it can look in Google</p>
        <p className="ln-seo-url">{shownUrl.replace(/^https?:\/\//, '')}</p>
        <p className="ln-seo-title">{title.length > TITLE_MAX ? `${title.slice(0, TITLE_MAX - 1)}…` : title}</p>
        <p className="ln-seo-desc">{description ? (description.length > DESC_MAX ? `${description.slice(0, DESC_MAX - 1)}…` : description) : 'No description yet. Google will pick text from the page instead.'}</p>
        <div className="ln-seo-counts">
          <Counter length={(text('seo.seoTitle') || '').length} max={TITLE_MAX} label="Title" />
          <Counter length={description.length} max={DESC_MAX} label="Description" />
          {noIndex ? <span className="ln-seo-count is-over">Hidden from search engines</span> : null}
        </div>
      </div>

      <div className="ln-seo-card ln-seo-share">
        <p className="ln-seo-label">When shared (WhatsApp, Facebook)</p>
        <div className="ln-seo-share-box">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of a remote image
            <img src={image} alt="" className="ln-seo-share-img" />
          ) : (
            <div className="ln-seo-share-img ln-seo-share-empty">No share image yet</div>
          )}
          <div className="ln-seo-share-text">
            <small>lankanewhomes.com</small>
            <strong>{title}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

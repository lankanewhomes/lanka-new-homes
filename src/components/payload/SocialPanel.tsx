'use client'

import { useCallback, useEffect, useState } from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import type { SocialAssetsRecord, SocialPostRecord } from '@/lib/social/publish'

// Project → Social tab. Shows the generated reel + carousel cards
// (SocialAssets), the caption that will be used, a "Post now" button, and
// the per-platform log (SocialPosts). Data comes from
// /payload-api/social-post, not from form state, so it's always what's
// actually saved — the generator CLI writes assets while this form may be open.

type StatusResponse = { configured: boolean; slug: string; assets: (SocialAssetsRecord & { id: string | number }) | null; caption: string; posts: SocialPostRecord[] }

const box: React.CSSProperties = { border: '1px solid var(--theme-elevation-150)', borderRadius: 6, background: 'var(--theme-elevation-0)', padding: '14px 16px', marginBottom: 14 }
const label: React.CSSProperties = { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, opacity: 0.65, marginBottom: 6 }
const pill = (status: string): React.CSSProperties => ({
  fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 700,
  background: status === 'published' ? '#e8f4e8' : status === 'processing' ? '#fff4e5' : status === 'dry_run' ? 'var(--theme-elevation-100)' : '#fdeaec',
  color: status === 'published' ? '#1a6b2f' : status === 'processing' ? '#9a5b00' : status === 'dry_run' ? 'inherit' : '#c0392b',
})

export function SocialPanel() {
  const { id } = useDocumentInfo()
  const slug = useFormFields(([fields]) => fields.slug?.value as string | undefined)
  const [data, setData] = useState<StatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [platforms, setPlatforms] = useState({ facebook: true, instagram: true })
  const [kinds, setKinds] = useState({ carousel: true, reel: true })

  const load = useCallback(async () => {
    if (!id) return
    const res = await fetch(`/payload-api/social-post?projectId=${id}`, { credentials: 'include' })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Could not load social status'); return }
    setData(json); setError(null)
  }, [id])

  useEffect(() => { load() }, [load])

  const post = async () => {
    if (!id) return
    setBusy(true); setError(null)
    try {
      const res = await fetch('/payload-api/social-post', {
        method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'post', projectId: id, platforms: Object.keys(platforms).filter((k) => platforms[k as keyof typeof platforms]), kinds: Object.keys(kinds).filter((k) => kinds[k as keyof typeof kinds]) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Posting failed')
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) } finally { setBusy(false) }
  }

  const finish = async (socialPostId: string | number) => {
    setBusy(true)
    try {
      await fetch('/payload-api/social-post', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'finish', socialPostId }) })
      await load()
    } finally { setBusy(false) }
  }

  if (!id) return <p style={{ fontSize: 13, opacity: 0.65 }}>Save the listing first, then generate its social assets.</p>

  const assets = data?.assets ?? null
  const cards = assets?.cards ?? []
  const cmd = `npm run social:generate -- ${slug ?? data?.slug ?? '<slug>'}`

  return (
    <div>
      <div style={{ ...box, borderColor: data?.configured ? '#cfe6cf' : '#f3d9a4', background: data?.configured ? '#f3faf3' : '#fff8ea' }}>
        <div style={label}>{data?.configured ? 'Connected' : 'Not connected yet'}</div>
        <div style={{ fontSize: 13 }}>
          {data?.configured
            ? 'Posts go to the LankaNewHomes Facebook Page and Instagram account.'
            : 'Meta credentials (META_PAGE_ID, META_PAGE_ACCESS_TOKEN, META_IG_USER_ID) are not set. "Post now" records a dry run so you can see exactly what would be sent. Setup: docs/social-publishing.md.'}
        </div>
      </div>

      <div style={box}>
        <div style={label}>Generated assets</div>
        {!assets ? (
          <div style={{ fontSize: 13 }}>
            Nothing generated yet. From the repo, run <code style={{ background: 'var(--theme-elevation-100)', padding: '2px 6px', borderRadius: 4 }}>{cmd}</code> — it renders the reel and carousel cards from this listing's photos and plans, uploads them, and they appear here.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 220px) 1fr', gap: 18, alignItems: 'start' }}>
            {assets.reelUrl ? (
              <video src={assets.reelUrl} poster={assets.reelPosterUrl ?? undefined} controls playsInline style={{ width: '100%', borderRadius: 8, background: '#000', aspectRatio: '9 / 16' }} />
            ) : <div style={{ fontSize: 12, opacity: 0.7 }}>No reel</div>}
            <div>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
                Reel {assets.reelDurationSec ? `${Math.round(assets.reelDurationSec)}s · ` : ''}{cards.length} carousel card{cards.length === 1 ? '' : 's'}
                {assets.generatedAt ? ` · generated ${new Date(assets.generatedAt).toLocaleString()}` : ''}{assets.notes ? ` · ${assets.notes}` : ''}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {cards.map((c, i) => (
                  <a key={c.url} href={c.url} target="_blank" rel="noreferrer" title={`Card ${i + 1}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.url} alt={`Card ${i + 1}`} style={{ width: 88, height: 110, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--theme-elevation-150)' }} />
                  </a>
                ))}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>Re-run <code>{cmd}</code> after changing photos or plans.</div>
            </div>
          </div>
        )}
      </div>

      <div style={box}>
        <div style={label}>Caption that will be posted</div>
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13, margin: 0, opacity: 0.9 }}>{data?.caption ?? '…'}</pre>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>Edit it in the Caption field below (leave it blank to use this default, built from the listing's own data).</div>
      </div>

      <div style={box}>
        <div style={label}>Post</div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', fontSize: 13 }}>
          <label><input type="checkbox" checked={platforms.facebook} onChange={(e) => setPlatforms({ ...platforms, facebook: e.target.checked })} /> Facebook Page</label>
          <label><input type="checkbox" checked={platforms.instagram} onChange={(e) => setPlatforms({ ...platforms, instagram: e.target.checked })} /> Instagram</label>
          <span style={{ opacity: 0.4 }}>|</span>
          <label><input type="checkbox" checked={kinds.carousel} onChange={(e) => setKinds({ ...kinds, carousel: e.target.checked })} /> Photo carousel</label>
          <label><input type="checkbox" checked={kinds.reel} onChange={(e) => setKinds({ ...kinds, reel: e.target.checked })} /> Reel</label>
          <button type="button" className="btn btn--style-primary" disabled={busy || !assets} onClick={post} style={{ marginLeft: 'auto' }}>
            {busy ? 'Posting…' : data?.configured ? 'Post now' : 'Post now (dry run)'}
          </button>
        </div>
        {error ? <div style={{ color: 'var(--theme-error-500)', fontSize: 13, marginTop: 10 }}>{error}</div> : null}
      </div>

      <div style={box}>
        <div style={label}>History</div>
        {!data?.posts?.length ? <div style={{ fontSize: 13, opacity: 0.7 }}>No posts yet.</div> : (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <tbody>
              {data.posts.map((p) => (
                <tr key={p.id} style={{ borderTop: '1px solid var(--theme-elevation-100)' }}>
                  <td style={{ padding: '8px 6px 8px 0', whiteSpace: 'nowrap' }}>{p.postedAt ? new Date(p.postedAt).toLocaleString() : ''}</td>
                  <td style={{ padding: '8px 6px', textTransform: 'capitalize' }}>{p.platform} · {p.kind}</td>
                  <td style={{ padding: '8px 6px' }}><span style={pill(p.status)}>{p.status.replace('_', ' ')}</span></td>
                  <td style={{ padding: '8px 6px', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.permalink ? <a href={p.permalink} target="_blank" rel="noreferrer">{p.permalink}</a> : p.error ? <span style={{ color: 'var(--theme-error-500)' }}>{p.error}</span> : p.triggeredBy === 'auto-post' ? 'auto-post' : ''}
                  </td>
                  <td style={{ padding: '8px 0 8px 6px', textAlign: 'right' }}>
                    {p.status === 'processing' ? <button type="button" className="btn btn--size-small" disabled={busy} onClick={() => finish(p.id)}>Check &amp; publish</button> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

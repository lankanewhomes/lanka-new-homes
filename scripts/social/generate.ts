// Generates a listing's social assets (9:16 story reel + 4:5 carousel cards)
// from its own photos and drawings, uploads them to R2 and records them in
// the SocialAssets collection so the project's Social tab can preview/post.
//
//   npm run social:generate -- <project-slug> [--no-depth] [--skip-reel] [--skip-cards] [--keep]
//
// Needs: the Python renderer venv (bash scripts/social/setup.sh) and ffmpeg.
// Runs with NODE_ENV=production (npm script) so Payload skips the dev-mode
// schema push while `next dev` may be running.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../../payload.config'
import { mirrorToR2 } from '@/lib/listing-import/mirror'
import { getProjectBySlugRaw } from '@/lib/project-store'
import { buildCaption, priceLine, typeLine } from '@/lib/social/caption'
import type { Project } from '@/types'

const args = process.argv.slice(2)
const slug = args.find((a) => !a.startsWith('--'))
const flag = (f: string) => args.includes(f)
if (!slug) { console.error('usage: npm run social:generate -- <project-slug> [--no-depth] [--skip-reel] [--skip-cards] [--keep]'); process.exit(1) }

const PLAN_PATH = /\/(amenities|floor-plans|road-map|block-plan)\//
const AERIAL = /aerial|drone|master-?plan|site-?plan|birds?-?eye|overview/i
const EXT_BY_TYPE: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const CONTENT_TYPE: Record<string, string> = { '.mp4': 'video/mp4', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' }

function python(): string {
  const candidates = [process.env.SOCIAL_PYTHON, process.env.SOCIAL_VENV && path.join(process.env.SOCIAL_VENV, 'bin', 'python3'), path.join(process.cwd(), '.venv-social', 'bin', 'python3')]
  for (const c of candidates) if (c && existsSync(c)) return c
  return 'python3'
}

async function download(url: string, dir: string, name: string): Promise<{ path: string } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const type = (res.headers.get('content-type') ?? '').split(';')[0].trim()
    const ext = EXT_BY_TYPE[type] ?? (path.extname(new URL(url).pathname).replace('.', '') || 'jpg')
    const file = path.join(dir, `${name}.${ext}`)
    writeFileSync(file, Buffer.from(await res.arrayBuffer()))
    return { path: file }
  } catch (error) {
    console.warn(`  skip ${url}: ${error instanceof Error ? error.message : error}`)
    return null
  }
}

function upper(s: string) { return s.replace(/\s+/g, ' ').trim().toUpperCase() }

async function main() {
  const project = await getProjectBySlugRaw(slug!)
  if (!project) throw new Error(`No project with slug "${slug}" (is it saved and synced?)`)
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  const doc = docs[0]
  if (!doc) throw new Error(`Payload has no project "${slug}"`)

  const work = path.join(os.tmpdir(), `lnh-social-${slug}`)
  const inDir = path.join(work, 'in'), outDir = path.join(work, 'out')
  rmSync(work, { recursive: true, force: true }); mkdirSync(inDir, { recursive: true }); mkdirSync(outDir, { recursive: true })

  // Photos: hero first, then the gallery in the developer's order; plan/amenity folders excluded (they aren't property photos).
  const seen = new Set<string>()
  const photoSources = [{ image: project.heroImage, label: 'Exterior' }, ...project.gallery]
    .filter((g) => g.image && !PLAN_PATH.test(g.image) && !seen.has(g.image) && seen.add(g.image))
    .slice(0, 8)
  console.log(`${project.name}: ${photoSources.length} photos`)
  const photos: { path: string; label: string }[] = []
  for (const [i, g] of photoSources.entries()) {
    const d = await download(g.image, inDir, `photo-${String(i + 1).padStart(2, '0')}`)
    if (d) photos.push({ path: d.path, label: g.label ?? '' })
  }
  if (!photos.length) throw new Error('No usable photos')
  const aerialIndex = Math.max(0, photoSources.findIndex((g) => AERIAL.test(g.image) || AERIAL.test(g.label ?? '')))

  // Plans (optional scenes): first floor plan with a drawing; the block plan image (dedicated field, or a gallery item labelled Block Plan).
  const plan = project.floorPlans.find((p) => p.image)
  const floorPlan = plan ? await download(plan.image, inDir, 'floor-plan') : null
  const blockUrl = project.blockPlanImages?.[0]?.image ?? project.gallery.find((g) => /block\s*plan/i.test(g.label))?.image
  const blockPlan = blockUrl ? await download(blockUrl, inDir, 'block-plan') : null

  const planCaption = plan ? [upper(plan.planName), plan.bedrooms > 0 && `${plan.bedrooms} BEDROOM${plan.bedrooms === 1 ? '' : 'S'}`, plan.floorAreaSqFt > 0 && `${plan.floorAreaSqFt.toLocaleString()} SQ FT`].filter(Boolean).join('   ·   ') : ''
  const unitWord = /villa/i.test(project.type) ? 'VILLA TYPES' : /house|town/i.test(project.type) ? 'HOUSE TYPES' : 'UNIT TYPES'
  const siteCaption = [project.units > 0 && `${project.units} HOMES`, project.floorPlans.length > 1 && `${project.floorPlans.length} ${unitWord}`, project.city && upper(project.city)].filter(Boolean).join('   ·   ')

  const spec = {
    slug: project.slug, name: project.name, city: project.city, developer: project.developerName, status: project.status,
    typeLine: typeLine(project), priceLine: priceLine(project), url: `lankanewhomes.com/projects/${project.slug}`,
    photos, aerial: aerialIndex,
    floorPlan: floorPlan ? { path: floorPlan.path, caption: planCaption } : null,
    blockPlan: blockPlan ? { path: blockPlan.path, caption: siteCaption } : null,
    amenities: (project.amenities ?? []).map((a) => a.name).slice(0, 6),
    topLine: 'NEW HOMES IN SRI LANKA', subLine: 'Discover New Developer Projects', brand: 'LankaNewHomes.com', brandDomain: 'lankanewhomes.com',
    ctaLine: 'Explore the project  →', siteLine: 'New homes · Apartments · Land — across Sri Lanka', ctaCard: 'Tap the link in bio',
  }
  const specPath = path.join(work, 'spec.json'); writeFileSync(specPath, JSON.stringify(spec, null, 1))

  const py = python()
  const pyArgs = [path.join(process.cwd(), 'scripts/social/render_social.py'), '--spec', specPath, '--out', outDir]
  if (flag('--no-depth')) pyArgs.push('--no-depth'); if (flag('--skip-reel')) pyArgs.push('--skip-reel'); if (flag('--skip-cards')) pyArgs.push('--skip-cards')
  console.log(`rendering with ${py} …`)
  const run = spawnSync(py, pyArgs, { stdio: ['ignore', 'inherit', 'inherit'] })
  if (run.status !== 0) throw new Error(`renderer exited with ${run.status}`)
  const manifest = JSON.parse(readFileSync(path.join(outDir, 'manifest.json'), 'utf8')) as { reel: string | null; poster: string | null; cards: string[]; durationSec: number | null }

  // Upload to R2 under the project's folder, then record.
  const keyFor = (file: string) => `projects/${slug}/social/${slug}_${path.basename(file).replace(/^reel\.mp4$/, 'reel.mp4').replace(/^poster\.jpg$/, 'reel-poster.jpg')}`
  const upload = async (file: string) => mirrorToR2(keyFor(file), readFileSync(file), CONTENT_TYPE[path.extname(file)] ?? 'application/octet-stream')
  const existing = await payload.find({ collection: 'social-assets', where: { project: { equals: doc.id } }, limit: 1, depth: 0, overrideAccess: true })
  const prev = existing.docs[0] as { id: string | number; reelUrl?: string | null; reelPosterUrl?: string | null; reelDurationSec?: number | null; cards?: { url: string }[] | null } | undefined
  const reelUrl = manifest.reel ? await upload(manifest.reel) : prev?.reelUrl ?? null
  const reelPosterUrl = manifest.poster ? await upload(manifest.poster) : prev?.reelPosterUrl ?? null
  const cards = manifest.cards.length ? await Promise.all(manifest.cards.map(async (c) => ({ url: await upload(c) }))) : prev?.cards ?? []
  const notes = `${photos.length} photos · plan scene: ${floorPlan ? 'yes' : 'no'} · site scene: ${blockPlan ? 'yes' : 'no'} · parallax: ${flag('--no-depth') ? 'off' : 'on'}`
  const data = { project: doc.id, reelUrl, reelPosterUrl, reelDurationSec: manifest.durationSec ?? prev?.reelDurationSec ?? null, cards, generatedAt: new Date().toISOString(), notes }
  if (prev) await payload.update({ collection: 'social-assets', id: prev.id, data: data as never, overrideAccess: true })
  else await payload.create({ collection: 'social-assets', data: data as never, overrideAccess: true })

  console.log('\nDone.')
  if (reelUrl) console.log('  reel   ', reelUrl)
  if (reelPosterUrl) console.log('  poster ', reelPosterUrl)
  cards.forEach((c, i) => console.log(`  card ${String(i + 1).padStart(2, '0')}`, c.url))
  console.log('\nDefault caption:\n' + buildCaption(project as Project).split('\n').map((l) => '  ' + l).join('\n'))
  console.log(`\nOpen /cms/collections/projects/${doc.id} → Social tab to preview and post.`)
  if (!flag('--keep')) rmSync(work, { recursive: true, force: true }); else console.log(`work dir kept: ${work}`)
  process.exit(0)
}

main().catch((error) => { console.error(error); process.exit(1) })

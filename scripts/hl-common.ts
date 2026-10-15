/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import helper */
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
export const SO = (await import('../src/collections/shared-fields')) as any
export const payload: any = await getPayload({ config: cfg })
export const HL_DIR = '/private/tmp/claude-501/-Users-rupansinnarajah-Desktop-lankanewhomes/e4990c10-5391-4fb0-8f5a-3a7fe8004abd/scratchpad/hlv'

export const find = async (collection: string, slug: string) =>
  ((await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any) ?? null
const n1 = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
export const so = (o: any, name: string, opts: string[]) => {
  const v = o[name]; if (v == null || v === '') return
  const hit = opts.find((x) => n1(x) === n1(String(v)))
  if (hit) { o[name] = hit; return }
  o[`${name}_other`] = v; delete o[name]
}
export const feat = (field_other: string, value_other: string) => ({ field_other, value_other })
export const up = (slug: string, sub: string, name: string, file: string, type = 'image/jpeg') =>
  mirrorToR2(`projects/${slug}/${sub}/${slug}_${name}`, fs.readFileSync(file), type)
export const checkAmenities = (names: string[]) => { for (const a of names) if (!(SO.AMENITY_NAME_OPTIONS as string[]).includes(a)) throw new Error('amenity not in vocabulary ' + a) }
export const near = (category: string, names: string[]) => names.map((name) => ({ category, name }))
export const addTodos = async (projectId: number, links: string[], todos: [string, string?][]) => {
  for (const [title, notes] of todos) {
    await payload.create({ collection: 'listing-todos', data: { title, listingType: 'project', project: projectId, notes, sourceLinks: links.join('\n') }, overrideAccess: true })
  }
}

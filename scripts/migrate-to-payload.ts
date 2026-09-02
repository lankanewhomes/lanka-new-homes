// One-time: copies existing Supabase rows (public.* tables) into Payload's
// collections (the `payload` Postgres schema — see docs/supabase-workflow.md
// and payload.config.ts). Safe to re-run: every write is an upsert keyed on
// `slug` (or, for Leads, skipped if a matching lead already exists).
//
// Not migrated (see the "Payload CMS backend" plan notes):
//  - Users/accounts — Supabase's password hashes aren't readable/compatible
//    with Payload's own auth.
//  - Hero Slides — the existing hero_ads shape doesn't map cleanly onto the
//    new field set.
//  - Saved Listings — would need a Payload user per buyer, which doesn't
//    exist without an account migration.
//
// Run with: npx tsx scripts/migrate-to-payload.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import type { supabaseAdmin as SupabaseAdmin } from '../src/lib/supabase'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })

// Dynamic imports (not static ones) on purpose: this project runs as native
// ESM (package.json "type": "module"), where static imports are hoisted
// above top-level statements — including the loadEnv() call above. Since
// payload.config.ts reads process.env.* at module-evaluation time, a static
// import of it here would run before loadEnv() populated those vars.
const { supabaseAdmin } = (await import('../src/lib/supabase')) as { supabaseAdmin: typeof SupabaseAdmin }
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default

type SlugMap = Map<string, string | number>

async function fetchRows(table: string): Promise<{ slug: string; data: Record<string, unknown> }[]> {
  const { data, error } = await supabaseAdmin.from(table).select('slug, data')
  if (error) throw new Error(`${table}: ${error.message}`)
  return (data ?? []) as { slug: string; data: Record<string, unknown> }[]
}

function pick<T extends Record<string, unknown>>(source: Record<string, unknown>, keys: (keyof T)[]): Partial<T> {
  const result: Partial<T> = {}
  for (const key of keys) {
    if (source[key as string] !== undefined) result[key] = source[key as string] as T[typeof key]
  }
  return result
}

function seoGroup(data: Record<string, unknown>) {
  return {
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    ogImage: data.ogImage,
    canonicalUrl: data.canonicalUrl,
    noIndex: data.noIndex,
  }
}

// Older rows may hold the legacy `{ indoor?, outdoor?, other? }` shape
// instead of the current KeyFeatureCategory[] shape — see the comment on
// `unitFeatures` in src/types/index.ts.
function normalizeUnitFeatures(value: unknown) {
  if (!value) return undefined
  if (Array.isArray(value)) return value
  const legacy = value as { indoor?: string[]; outdoor?: string[]; other?: string[] }
  const categories: { key: string; label: string; items: { field: string; value: string }[] }[] = []
  for (const [key, label] of [
    ['indoor', 'Indoor'],
    ['outdoor', 'Outdoor'],
    ['other', 'Other'],
  ] as const) {
    const items = legacy[key]
    if (items?.length) categories.push({ key, label, items: items.map((v) => ({ field: label, value: v })) })
  }
  return categories.length ? categories : undefined
}

// Heterogeneous target shapes across collections make precise per-call
// typing more trouble than it's worth for a one-off migration script — the
// `as any` casts below are scoped to this helper only.
async function upsertDirectory(
  payload: Payload,
  collection: CollectionSlug,
  rows: { slug: string; data: Record<string, unknown> }[],
  buildFields: (data: Record<string, unknown>) => Record<string, unknown>,
): Promise<SlugMap> {
  const map: SlugMap = new Map()
  for (const row of rows) {
    const existing = await payload.find({
      collection,
      where: { slug: { equals: row.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const fields = { slug: row.slug, name: row.data.name, ...buildFields(row.data) }
    // `collection` is a runtime variable here, not a literal, so Payload
    // can't narrow `data` to a specific collection's generated type.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const doc = existing.docs[0]
      ? await payload.update({ collection, id: existing.docs[0].id, data: fields as any, overrideAccess: true, depth: 0 })
      : await payload.create({ collection, data: fields as any, overrideAccess: true, depth: 0 })
    /* eslint-enable @typescript-eslint/no-explicit-any */
    map.set(row.slug, doc.id)
  }
  console.log(`${collection}: ${map.size} migrated`)
  return map
}

async function main() {
  const payload = await getPayload({ config: payloadConfig })

  await upsertDirectory(payload, 'construction-companies', await fetchRows('construction_companies'), (d) => ({
    logo: d.logo,
    description: d.description,
    contact_email: d.email,
    contact_phone: d.phone,
    services: d.categories,
  }))

  const marketingCompanies = await upsertDirectory(payload, 'marketing-companies', await fetchRows('marketing_companies'), (d) => ({
    logo: d.logo,
    description: d.description,
    contact_email: d.email,
    contact_phone: d.phone,
  }))

  const salesCompanies = await upsertDirectory(payload, 'sales-companies', await fetchRows('sales_companies'), (d) => ({
    logo: d.logo,
    description: d.description,
    contact_email: d.email,
    contact_phone: d.phone,
  }))

  const architects = await upsertDirectory(payload, 'architects', await fetchRows('architects'), (d) => ({
    logo: d.logo,
    description: d.description,
    contact_email: d.email,
    contact_phone: d.phone,
    portfolio_link: d.website,
  }))

  await upsertDirectory(payload, 'neighborhoods', await fetchRows('neighborhoods'), (d) => ({
    city: d.city,
    province: d.province,
    description: d.description,
    heroImage: d.heroImage,
    seo: seoGroup(d),
  }))

  const developers = await upsertDirectory(payload, 'developers', await fetchRows('developers'), (d) => ({
    logo: d.logo,
    description: d.description,
    contact_email: d.email,
    contact_phone: d.phone,
    website: d.website,
    seo: seoGroup(d),
  }))

  // Projects — needs the slug->id maps built above, plus the indexed
  // `is_verified` column (not yet mirrored into `data`, see
  // supabase/migrations/20260827120500_verification_workflow.sql).
  const { data: projectRows, error: projectError } = await supabaseAdmin
    .from('projects')
    .select('slug, is_verified, data')
  if (projectError) throw new Error(`projects: ${projectError.message}`)

  const projectDirectFields = [
    'location', 'district', 'city', 'province', 'neighborhood', 'neighborhoodSlug',
    'road', 'area', 'electricity', 'tapWater', 'type', 'status', 'isMoveInNow',
    'coDevelopers', 'launchDate', 'completionYear', 'constructionStatus', 'constructionStarted',
    'startingPriceLkr', 'priceRange', 'bedrooms', 'bathrooms', 'floorAreaRange', 'units', 'floors',
    'carparkLevels', 'averageUnitPriceLkr', 'averageFloorAreaSqFt', 'parking', 'security', 'ownership',
    'ceilingInfo', 'paymentPlan', 'paymentPlanItems', 'availablePlanPrices', 'pricingComingSoon',
    'averagePricePerSqft', 'monthlyMaintenancePerSqft', 'propertyTax', 'parkingCost', 'storageCost',
    'coopFeeRealtors', 'pricingHistory', 'availabilityHistory', 'statusHistory', 'completionDateHistory',
    'depositPaymentStructure', 'incentives', 'summary', 'description', 'heroImage', 'gallery',
    'brochureUrl', 'videos', 'virtualTours', 'interactiveMapUrl', 'mobileVisibleStats',
    'desktopVisibleStats', 'floorPlanVisibleStats', 'amenities', 'floorPlans', 'nearby', 'hotDeal',
    'coordinates', 'contact', 'factsGrid', 'includedUtilities', 'paidUtilities',
  ] as const

  let migratedProjects = 0
  let skippedProjects = 0
  for (const row of (projectRows ?? []) as { slug: string; is_verified: boolean | null; data: Record<string, unknown> }[]) {
    const d = row.data
    const developerId = developers.get(String(d.developerSlug ?? ''))
    if (!developerId) {
      console.warn(`projects: skipping "${row.slug}" — no matching developer for slug "${d.developerSlug}"`)
      skippedProjects += 1
      continue
    }

    const fields: Record<string, unknown> = {
      slug: row.slug,
      name: d.name,
      developer: developerId,
      architect: d.architectSlug ? architects.get(String(d.architectSlug)) : undefined,
      marketing_company: d.marketingCompanySlug ? marketingCompanies.get(String(d.marketingCompanySlug)) : undefined,
      sales_company: d.salesCompanySlug ? salesCompanies.get(String(d.salesCompanySlug)) : undefined,
      featured: Boolean(d.isFeatured),
      isVerified: row.is_verified ?? Boolean(d.isVerified),
      unitFeatures: normalizeUnitFeatures(d.unitFeatures),
      seo: seoGroup(d),
      ...pick(d, projectDirectFields as unknown as (keyof Record<string, unknown>)[]),
    }

    const existing = await payload.find({
      collection: 'projects',
      where: { slug: { equals: row.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    // `fields` is assembled dynamically and doesn't structurally match
    // Payload's generated Project data type exactly.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    if (existing.docs[0]) {
      await payload.update({ collection: 'projects', id: existing.docs[0].id, data: fields as any, overrideAccess: true, depth: 0 })
    } else {
      await payload.create({ collection: 'projects', data: fields as any, overrideAccess: true, depth: 0 })
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
    migratedProjects += 1
  }
  console.log(`projects: ${migratedProjects} migrated${skippedProjects ? `, ${skippedProjects} skipped (no matching developer)` : ''}`)

  // Leads — no account linking (the old table was never linked to auth.users).
  const { data: leadRows, error: leadError } = await supabaseAdmin
    .from('leads')
    .select('name, email, phone, message, project_slug')
  if (leadError) throw new Error(`leads: ${leadError.message}`)

  let migratedLeads = 0
  let skippedLeads = 0
  for (const lead of (leadRows ?? []) as { name: string; email: string; phone: string; message: string; project_slug: string }[]) {
    const projectDoc = await payload.find({
      collection: 'projects',
      where: { slug: { equals: lead.project_slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const projectId = projectDoc.docs[0]?.id
    if (!projectId) {
      skippedLeads += 1
      continue
    }
    const existing = await payload.find({
      collection: 'leads',
      where: { and: [{ email: { equals: lead.email } }, { project: { equals: projectId } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.docs.length > 0) continue
    await payload.create({
      collection: 'leads',
      data: { name: lead.name, email: lead.email, phone: lead.phone, message: lead.message, project: projectId },
      overrideAccess: true,
      depth: 0,
    })
    migratedLeads += 1
  }
  console.log(`leads: ${migratedLeads} migrated${skippedLeads ? `, ${skippedLeads} skipped (no matching project)` : ''}`)

  await payload.destroy()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

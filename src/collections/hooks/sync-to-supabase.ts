import type { CollectionAfterChangeHook, PayloadRequest } from 'payload'
import { supabaseAdmin } from '@/lib/supabase'
import { insertLead } from '@/lib/tracking-db'

// Payload -> Supabase, one-way: whatever gets saved in Payload overwrites
// the matching Supabase row (same slug) so the existing frontend — which
// still reads Supabase directly, not Payload — picks it up. A failure here
// is logged but never blocks the Payload save itself (Supabase being slow/
// down shouldn't stop someone from editing in the admin panel).
async function safeSync(req: PayloadRequest, label: string, fn: () => Promise<void>) {
  try {
    await fn()
  } catch (err) {
    req.payload.logger.error(`Supabase sync failed (${label}): ${err instanceof Error ? err.message : err}`)
  }
}

function relId(value: unknown): string | number | undefined {
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: string | number }).id
  return value as string | number | undefined
}

// Resolves a relationship field (id, or already-populated doc) to its
// slug/name — re-fetching by id when the hook's `doc` wasn't populated at
// the depth this save happened at.
async function resolveSlugName(req: PayloadRequest, collection: string, value: unknown): Promise<{ slug?: string; name?: string }> {
  if (!value) return {}
  if (typeof value === 'object' && 'slug' in (value as object)) {
    const v = value as { slug?: string; name?: string }
    return { slug: v.slug, name: v.name }
  }
  const id = relId(value)
  if (!id) return {}
  const doc = await req.payload
    .findByID({ collection: collection as never, id, depth: 0, overrideAccess: true, req })
    .catch(() => null)
  return doc ? { slug: (doc as { slug?: string }).slug, name: (doc as { name?: string }).name } : {}
}

async function resolveSlugList(req: PayloadRequest, collection: string, values: unknown[] | undefined | null): Promise<string[]> {
  if (!values?.length) return []
  const resolved = await Promise.all(values.map((v) => resolveSlugName(req, collection, v)))
  return resolved.map((r) => r.slug).filter((slug): slug is string => Boolean(slug))
}

// A select+"(Other)" text pair (see shared-fields.ts's selectWithOther) ->
// one effective plain value, matching what the legacy (pre-Payload) fields
// always expected. The two fields are independent (no dropdown "Other"
// sentinel value) — whichever one was actually filled in wins, with the
// free-text "(Other)" field taking priority since it's only ever filled in
// when the dropdown didn't have the right option.
function resolveOther(value: unknown, other: unknown): string | undefined {
  const otherStr = typeof other === 'string' ? other.trim() : ''
  if (otherStr) return otherStr
  return (value as string) || undefined
}

type AnyDoc = Record<string, unknown>

// floorPlans' planType/basement/garage are each selectWithOther pairs (see
// Projects.ts) — collapse each down to a flat value the frontend's
// FloorPlan type expects.
function resolveFloorPlans(raw: unknown): AnyDoc[] {
  if (!Array.isArray(raw)) return []
  return raw.map((plan) => {
    const p = { ...(plan as AnyDoc) }
    p.planType = resolveOther(p.planType, p.planType_other)
    p.basement = resolveOther(p.basement, p.basement_other)
    p.garage = resolveOther(p.garage, p.garage_other)
    p.parkingType = resolveOther(p.parkingType, p.parkingType_other)
    delete p.planType_other
    delete p.basement_other
    delete p.garage_other
    delete p.parkingType_other
    return p
  })
}

// unitFeatures' key/field/value are each selectWithOther pairs (see
// shared-fields.ts's unitFeaturesField) — collapse every pair down to the
// flat {key, label, items: [{field, value}]} shape the frontend's
// normalizeUnitFeaturesForDisplay expects, same idea as resolveOther above
// but applied through the nested array.
function resolveUnitFeatures(raw: unknown): AnyDoc[] {
  if (!Array.isArray(raw)) return []
  return raw.map((group) => {
    const g = group as AnyDoc
    return {
      key: resolveOther(g.key, g.key_other) ?? '',
      label: g.label,
      items: (Array.isArray(g.items) ? (g.items as AnyDoc[]) : []).map((item) => ({
        field: resolveOther(item.field, item.field_other) ?? '',
        value: resolveOther(item.value, item.value_other) ?? '',
      })),
    }
  })
}

export const syncProjectToSupabase: CollectionAfterChangeHook = async ({ doc, req }) => {
  const d = doc as AnyDoc
  await safeSync(req, `project ${d.slug}`, async () => {
    const [developer, architect, marketing, sales, interiorDesigner, neighborhoodRel] = await Promise.all([
      resolveSlugName(req, 'developers', d.developer),
      resolveSlugName(req, 'architects', d.architect),
      resolveSlugName(req, 'marketing-companies', d.marketing_company),
      resolveSlugName(req, 'sales-companies', d.sales_company),
      resolveSlugName(req, 'interior-designers', d.interior_designer),
      resolveSlugName(req, 'neighborhoods', d.neighborhood),
    ])
    const [additionalDeveloperSlugs, additionalBuilderSlugs] = await Promise.all([
      resolveSlugList(req, 'developers', d.additional_developers as unknown[]),
      resolveSlugList(req, 'construction-companies', d.additional_builders as unknown[]),
    ])

    const seo = (d.seo as AnyDoc) ?? {}
    const placements = ((d.placements as AnyDoc[]) ?? []).map((p) => ({
      page: p.page,
      startDate: p.start_date,
      endDate: p.end_date,
    }))

    const project: AnyDoc = {
      ...d,
      developerSlug: developer.slug ?? d.developerSlug,
      developerName: developer.name ?? d.developerName,
      architectSlug: architect.slug,
      architectName: architect.name,
      marketingCompanySlug: marketing.slug,
      marketingCompanyName: marketing.name,
      salesCompanySlug: sales.slug,
      salesCompanyName: sales.name,
      interiorDesignerSlug: interiorDesigner.slug,
      interiorDesignerName: interiorDesigner.name,
      neighborhood: neighborhoodRel.name ?? d.neighborhood_other ?? '',
      neighborhoodSlug: neighborhoodRel.slug,
      district: resolveOther(d.district, d.district_other) ?? '',
      city: resolveOther(d.city, d.city_other) ?? '',
      province: resolveOther(d.province, d.province_other) ?? '',
      ownership: resolveOther(d.ownership, d.ownership_other),
      constructionStatus: resolveOther(d.constructionStatus, d.constructionStatus_other),
      security: resolveOther(d.security, d.security_other),
      parkingType: resolveOther(d.parkingType, d.parkingType_other),
      electricity: resolveOther(d.electricity, d.electricity_other),
      tapWater: resolveOther(d.tapWater, d.tapWater_other),
      type: resolveOther(d.type, d.type_other) ?? '',
      unitFeatures: resolveUnitFeatures(d.unitFeatures),
      floorPlans: resolveFloorPlans(d.floorPlans),
      isFeatured: Boolean(d.featured),
      additionalDeveloperSlugs,
      additionalBuilderSlugs,
      placements,
      completenessScore: d.completeness_score,
      viewCount: d.view_count,
      saveCount: d.save_count,
      leadCount: d.lead_count,
      paidBoost: d.paid_boost,
      finalScore: d.final_score,
      verification: {
        developerVerified: d.verification_developer_verified,
        addressVerified: d.verification_address_verified,
        priceVerified: d.verification_price_verified,
        floorPlansVerified: d.verification_floor_plans_verified,
        completionDateVerified: d.verification_completion_date_verified,
        ownershipVerified: d.verification_ownership_verified,
        documentsVerified: d.verification_documents_verified,
      },
      seoTitle: seo.seoTitle,
      seoDescription: seo.seoDescription,
      ogImage: seo.ogImage,
      canonicalUrl: seo.canonicalUrl,
      noIndex: seo.noIndex,
    }

    const row = {
      slug: d.slug,
      name: project.name,
      developer_slug: project.developerSlug,
      developer_name: project.developerName,
      status: project.status,
      type: project.type,
      starting_price_lkr: project.startingPriceLkr,
      location: project.location,
      city: project.city,
      district: project.district,
      province: project.province,
      neighborhood: project.neighborhood,
      is_featured: Boolean(project.isFeatured),
      is_move_in_now: Boolean(project.isMoveInNow),
      data: project,
    }
    const { error } = await supabaseAdmin.from('projects').upsert(row, { onConflict: 'slug' })
    if (error) throw new Error(error.message)
  })
  return doc
}

export const syncDeveloperToSupabase: CollectionAfterChangeHook = async ({ doc, req }) => {
  const d = doc as AnyDoc
  await safeSync(req, `developer ${d.slug}`, async () => {
    const developer: AnyDoc = {
      slug: d.slug,
      name: d.name,
      logo: d.logo,
      description: d.description,
      location: d.location ?? '',
      establishedYear: d.establishedYear,
      yearsInBusiness: d.yearsInBusiness,
      activeProjects: d.activeProjects,
      completedProjects: d.completedProjects,
      coDevelopers: d.coDevelopers,
      officeHours: d.officeHours,
      website: d.website,
      email: d.contact_email,
      phone: d.contact_phone,
      socialLinks: d.socialLinks,
      verificationStatus: d.verification_status,
      seoTitle: (d.seo as AnyDoc)?.seoTitle,
      seoDescription: (d.seo as AnyDoc)?.seoDescription,
      ogImage: (d.seo as AnyDoc)?.ogImage,
      canonicalUrl: (d.seo as AnyDoc)?.canonicalUrl,
      noIndex: (d.seo as AnyDoc)?.noIndex,
    }
    const { error } = await supabaseAdmin
      .from('developers')
      .upsert({ slug: d.slug, name: d.name, location: d.location ?? '', data: developer }, { onConflict: 'slug' })
    if (error) throw new Error(error.message)
  })
  return doc
}

export const syncNeighborhoodToSupabase: CollectionAfterChangeHook = async ({ doc, req }) => {
  const d = doc as AnyDoc
  await safeSync(req, `neighborhood ${d.slug}`, async () => {
    const neighborhood: AnyDoc = {
      slug: d.slug,
      name: d.name,
      city: d.city,
      province: d.province,
      description: d.description,
      heroImage: d.heroImage,
      seoTitle: (d.seo as AnyDoc)?.seoTitle,
      seoDescription: (d.seo as AnyDoc)?.seoDescription,
      ogImage: (d.seo as AnyDoc)?.ogImage,
      canonicalUrl: (d.seo as AnyDoc)?.canonicalUrl,
      noIndex: (d.seo as AnyDoc)?.noIndex,
    }
    const { error } = await supabaseAdmin
      .from('neighborhoods')
      .upsert({ slug: d.slug, name: d.name, city: d.city, province: d.province, data: neighborhood }, { onConflict: 'slug' })
    if (error) throw new Error(error.message)
  })
  return doc
}

export const syncConstructionCompanyToSupabase: CollectionAfterChangeHook = async ({ doc, req }) => {
  const d = doc as AnyDoc
  await safeSync(req, `construction company ${d.slug}`, async () => {
    const company: AnyDoc = {
      slug: d.slug,
      name: d.name,
      logo: d.logo,
      description: d.description,
      location: '',
      categories: ['general'],
      email: d.contact_email,
      phone: d.contact_phone,
      services: d.services,
    }
    const { error } = await supabaseAdmin
      .from('construction_companies')
      .upsert({ slug: d.slug, name: d.name, location: '', data: company }, { onConflict: 'slug' })
    if (error) throw new Error(error.message)
  })
  return doc
}

function companyProfileSyncHook(table: string): CollectionAfterChangeHook {
  return async ({ doc, req }) => {
    const d = doc as AnyDoc
    await safeSync(req, `${table} ${d.slug}`, async () => {
      const profile: AnyDoc = {
        slug: d.slug,
        name: d.name,
        logo: d.logo,
        description: d.description,
        location: '',
        email: d.contact_email,
        phone: d.contact_phone,
        services: d.services,
        portfolioLink: d.portfolio_link,
      }
      const { error } = await supabaseAdmin.from(table).upsert({ slug: d.slug, name: d.name, location: '', data: profile }, { onConflict: 'slug' })
      if (error) throw new Error(error.message)
    })
    return doc
  }
}

export const syncMarketingCompanyToSupabase = companyProfileSyncHook('marketing_companies')
export const syncSalesCompanyToSupabase = companyProfileSyncHook('sales_companies')
export const syncArchitectToSupabase = companyProfileSyncHook('architects')
export const syncInteriorDesignerToSupabase = companyProfileSyncHook('interior_designers')

// Polymorphic relationship (relationTo: ['developers', 'construction-companies'])
// -> its slug, whichever collection it actually points at. Unpopulated
// shape is { relationTo, value: id }; populated (depth > 0) has value as
// the full doc.
async function resolvePolymorphicSlug(req: PayloadRequest, value: unknown): Promise<string | undefined> {
  if (!value || typeof value !== 'object') return undefined
  const v = value as { relationTo?: string; value?: unknown }
  if (!v.relationTo || v.value === undefined) return undefined
  const resolved = await resolveSlugName(req, v.relationTo, v.value)
  return resolved.slug
}

export const syncLandToSupabase: CollectionAfterChangeHook = async ({ doc, req }) => {
  const d = doc as AnyDoc
  await safeSync(req, `land ${d.slug}`, async () => {
    const sellerSlug = await resolvePolymorphicSlug(req, d.seller)
    const seo = (d.seo as AnyDoc) ?? {}

    const land: AnyDoc = {
      ...d,
      sellerSlug,
      district: resolveOther(d.district, d.district_other) ?? '',
      city: resolveOther(d.city, d.city_other) ?? '',
      province: resolveOther(d.province, d.province_other) ?? '',
      electricity: resolveOther(d.electricity, d.electricity_other),
      unitFeatures: resolveUnitFeatures(d.unitFeatures),
      isFeatured: Boolean(d.isFeatured),
      seoTitle: seo.seoTitle,
      seoDescription: seo.seoDescription,
      ogImage: seo.ogImage,
      canonicalUrl: seo.canonicalUrl,
      noIndex: seo.noIndex,
    }

    const row = {
      slug: d.slug,
      title: land.title,
      seller_type: land.sellerType,
      seller_slug: sellerSlug ?? null,
      seller_name: land.sellerName,
      status: land.status,
      price_lkr: land.priceLkr,
      district: land.district,
      city: land.city,
      province: land.province,
      is_featured: Boolean(land.isFeatured),
      data: land,
    }
    const { error } = await supabaseAdmin.from('lands').upsert(row, { onConflict: 'slug' })
    if (error) throw new Error(error.message)
  })
  return doc
}

export const syncLeadToSupabase: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc
  // The live inquiry form (src/app/(frontend)/api/leads/route.ts) writes to
  // Supabase directly *and* mirrors the lead into this Payload collection
  // (so builders can manage lead status in /cms) — it sets this
  // context flag on that mirrored create so this hook doesn't also insert a
  // second, duplicate Supabase row for the same submission.
  if (req.context?.skipSupabaseSync) return doc
  const d = doc as AnyDoc
  await safeSync(req, `lead ${d.id}`, async () => {
    const project = await resolveSlugName(req, 'projects', d.project)
    const developer = project.slug ? await resolveSlugName(req, 'developers', (await req.payload.findByID({ collection: 'projects', id: relId(d.project) as string | number, depth: 0, overrideAccess: true, req })).developer) : {}
    if (!project.slug || !developer.slug) return
    await insertLead({
      name: d.name as string,
      email: (d.email as string) ?? '',
      phone: (d.phone as string) ?? '',
      preferredContactMethod: 'Email',
      message: (d.message as string) ?? '',
      projectSlug: project.slug,
      developerSlug: developer.slug,
    })
  })
  return doc
}

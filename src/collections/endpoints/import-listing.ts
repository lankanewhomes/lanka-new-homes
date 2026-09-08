import type { Endpoint, PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'
import { getOwnedDeveloperIds, isAdmin } from '../access'
import { extractFromHtml, extractFromText, toSlug, type ImportDraft } from '@/lib/listing-import/extract'
import { fetchWithLimit, isMirrorConfigured, mirrorRemoteFiles, mirrorToR2 } from '@/lib/listing-import/mirror'
import { CITY_OPTIONS, DISTRICT_OPTIONS, PROJECT_TYPE_OPTIONS } from '../shared-fields'

// POST /payload-api/import-listing — "Import from your website" (the
// /cms/import view). Body: { url?: string; pdfBase64?: string; pdfName?:
// string; developerId?: number }. Fetches the page (and its linked brochure,
// or the uploaded PDF), extracts what's literally there, mirrors the photos
// into R2, and creates an UNPUBLISHED project for the signed-in developer
// (admins pick the developer). Nothing is invented: sizes/prices/bedrooms
// found in the text come back as `signals` for the developer to confirm in
// the editor, not as floor plans.

type ImportBody = { url?: string; pdfBase64?: string; pdfName?: string; developerId?: number | string }

const MAX_HTML_BYTES = 3 * 1024 * 1024
const MAX_PDF_BYTES = 15 * 1024 * 1024
const MAX_GALLERY = 10
const MAX_FLOOR_PLAN_IMAGES = 8

async function pdfText(buffer: Buffer): Promise<string> {
  const { default: parse } = await import('pdf-parse/lib/pdf-parse.js')
  const result = await parse(buffer)
  return result.text ?? ''
}

async function uniqueSlug(req: PayloadRequest, base: string): Promise<string> {
  let slug = base || 'imported-project'
  for (let n = 2; n < 50; n++) {
    const { totalDocs } = await req.payload.count({ collection: 'projects', where: { slug: { equals: slug } }, overrideAccess: true })
    if (!totalDocs) return slug
    slug = `${base}-${n}`
  }
  return `${base}-${Date.now()}`
}

const withOther = (value: string | undefined, options: readonly string[]) =>
  value ? ((options as readonly string[]).includes(value) ? { select: value } : { other: value }) : {}

export const importListingEndpoint: Endpoint = {
  path: '/import-listing',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    if (!req.user) return Response.json({ error: 'Not signed in.' }, { status: 401 })
    await addDataAndFileToRequest(req)
    const body = (req.data ?? {}) as ImportBody
    const url = typeof body.url === 'string' ? body.url.trim() : ''
    if (!url && !body.pdfBase64) return Response.json({ error: 'Paste a project web page URL or upload a brochure PDF.' }, { status: 400 })
    if (url && !/^https?:\/\//i.test(url)) return Response.json({ error: 'The URL must start with http:// or https://' }, { status: 400 })

    // Whose project is this? Developers can only import into their own company.
    let developerId: number | string | undefined
    if (isAdmin(req)) {
      developerId = body.developerId
      if (!developerId) return Response.json({ error: 'Pick the developer this project belongs to.' }, { status: 400 })
    } else {
      const owned = await getOwnedDeveloperIds(req)
      if (!owned.length) return Response.json({ error: 'Your account is not linked to a developer profile yet.' }, { status: 403 })
      developerId = owned[0]
    }
    const developer = await req.payload.findByID({ collection: 'developers', id: developerId, depth: 0, overrideAccess: true }).catch(() => null)
    if (!developer) return Response.json({ error: 'Developer not found.' }, { status: 404 })

    // 1. Page
    let draft: ImportDraft | undefined
    const warnings: string[] = []
    if (url) {
      try {
        const { body: html, contentType } = await fetchWithLimit(url, { timeoutMs: 15_000, maxBytes: MAX_HTML_BYTES, accept: 'text/html,application/xhtml+xml' })
        if (!/html|xml|text/.test(contentType) && !/^\s*</.test(html.toString('utf8', 0, 200))) warnings.push(`The URL returned ${contentType || 'an unknown type'}, not a web page.`)
        draft = extractFromHtml(html.toString('utf8'), url)
      } catch (error) {
        return Response.json({ error: `Could not fetch that page: ${error instanceof Error ? error.message : String(error)}` }, { status: 422 })
      }
    }

    // 2. Brochure — uploaded, or the PDF the page links to.
    let pdfBuffer: Buffer | undefined
    let pdfSource = ''
    if (body.pdfBase64) {
      pdfBuffer = Buffer.from(body.pdfBase64.replace(/^data:[^,]*,/, ''), 'base64')
      pdfSource = body.pdfName || 'uploaded brochure'
      if (pdfBuffer.length > MAX_PDF_BYTES) return Response.json({ error: 'The PDF is over 15 MB.' }, { status: 413 })
    } else if (draft?.brochureUrl) {
      try {
        const { body: pdf } = await fetchWithLimit(draft.brochureUrl, { timeoutMs: 20_000, maxBytes: MAX_PDF_BYTES })
        pdfBuffer = pdf
        pdfSource = draft.brochureUrl
      } catch (error) {
        warnings.push(`Linked brochure could not be downloaded (${error instanceof Error ? error.message : String(error)}).`)
      }
    }
    if (pdfBuffer) {
      try {
        const text = await pdfText(pdfBuffer)
        if (text.trim().length < 200) warnings.push(`The brochure (${pdfSource}) has no readable text — it's image-only, so nothing could be read from it.`)
        else draft = extractFromText(text, draft)
      } catch (error) {
        warnings.push(`Brochure could not be parsed (${error instanceof Error ? error.message : String(error)}).`)
      }
    }
    if (!draft) return Response.json({ error: 'Nothing could be read from the input.' }, { status: 422 })
    warnings.push(...draft.warnings)
    if (draft.address) warnings.push(`Address was read as "${draft.address}" — make sure that's the project site, not the company office.`)

    // 3. Slug + media
    const name = draft.name || (draft.sourceUrl ? new URL(draft.sourceUrl).hostname.replace(/^www\./, '') : 'Imported project')
    const slug = await uniqueSlug(req, toSlug(name))
    let heroImage = ''
    const gallery: { label: string; image: string }[] = []
    let brochureUrl = draft.brochureUrl ?? ''
    if (isMirrorConfigured()) {
      const photos = await mirrorRemoteFiles(draft.images, { keyPrefix: `projects/${slug}/gallery`, namePrefix: slug, label: 'image', max: MAX_GALLERY })
      photos.mirrored.forEach((m, i) => gallery.push({ label: `Photo ${i + 1}`, image: m.url }))
      if (photos.failed.length) warnings.push(`${photos.failed.length} photo(s) could not be copied: ${photos.failed.slice(0, 3).map((f) => f.reason).join('; ')}`)
      const plans = await mirrorRemoteFiles(draft.floorPlanImages, { keyPrefix: `projects/${slug}/floor-plans`, namePrefix: slug, label: 'floor-plan', max: MAX_FLOOR_PLAN_IMAGES })
      plans.mirrored.forEach((m, i) => gallery.push({ label: `Floor Plan ${i + 1}`, image: m.url }))
      if (pdfBuffer && pdfBuffer.length <= MAX_PDF_BYTES) {
        try { brochureUrl = await mirrorToR2(`projects/${slug}/brochure/${slug}_brochure.pdf`, pdfBuffer, 'application/pdf') } catch (error) { warnings.push(`Brochure could not be stored (${error instanceof Error ? error.message : String(error)}).`) }
      }
      heroImage = gallery[0]?.image ?? ''
    } else {
      warnings.push('R2 storage is not configured in this environment — photos were not copied; add them in the editor.')
    }

    // 4. Create the draft (unpublished). overrideAccess:false so a developer
    //    can only ever create under their own company.
    const city = withOther(draft.city, CITY_OPTIONS)
    const district = withOther(draft.district, DISTRICT_OPTIONS)
    const type = withOther(draft.type, PROJECT_TYPE_OPTIONS)
    const data: Record<string, unknown> = {
      slug,
      name,
      developer: developer.id,
      isPublished: false,
      summary: draft.summary,
      description: draft.description,
      highlights: draft.highlights,
      heroImage,
      gallery,
      brochureUrl: brochureUrl || undefined,
      location: draft.address,
      // (address may still be a company office when a page has no project
      // address of its own — flagged in warnings for the developer to check)
      ...(city.select ? { city: city.select } : city.other ? { city_other: city.other } : {}),
      ...(district.select ? { district: district.select } : district.other ? { district_other: district.other } : {}),
      ...(type.select ? { type: type.select } : type.other ? { type_other: type.other } : {}),
      amenities: draft.amenities.map((name) => ({ name })),
      nearby: draft.nearby.map((place) => ({ category: 'Landmark', name: place.name, ...(place.distanceKm ? { distanceKm: place.distanceKm } : {}) })),
      contact: { name: developer.name, email: draft.emails[0] ?? developer.contact_email ?? undefined, phone: draft.phones[0] ?? developer.contact_phone ?? undefined },
      units: draft.units,
      floors: draft.floors,
      completionYear: draft.completionYear,
      startingPriceLkr: draft.startingPriceLkr ?? 0,
      socialLinks: Object.keys(draft.socialLinks).length ? draft.socialLinks : undefined,
    }
    for (const key of Object.keys(data)) if (data[key] === undefined) delete data[key]

    let created
    try {
      created = await req.payload.create({ collection: 'projects', data: data as never, req, overrideAccess: false })
    } catch (error) {
      return Response.json({ error: `The draft could not be saved: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 })
    }

    return Response.json({
      ok: true,
      project: { id: created.id, slug, name, editUrl: `/cms/collections/projects/${created.id}`, previewUrl: `/listing-preview/${slug}` },
      found: {
        photos: gallery.filter((g) => g.label.startsWith('Photo')).length,
        floorPlanImages: gallery.filter((g) => g.label.startsWith('Floor')).length,
        brochure: Boolean(brochureUrl),
        description: Boolean(draft.description),
        highlights: draft.highlights.length,
        amenities: draft.amenities,
        nearby: draft.nearby.length,
        address: draft.address ?? null,
        city: draft.city ?? null,
        type: draft.type ?? null,
        phones: draft.phones,
        emails: draft.emails,
        units: draft.units ?? null,
        floors: draft.floors ?? null,
        completionYear: draft.completionYear ?? null,
        startingPriceLkr: draft.startingPriceLkr ?? null,
      },
      signals: draft.signals,
      warnings,
    })
  },
}

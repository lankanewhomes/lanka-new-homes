# SEO Strategy — LankaLiving

This file is the source of truth for the site's SEO information architecture:
which URL targets which keywords, and the tactics applied across those pages.
Update this file whenever a new keyword group or page is added.

## URL structure

| URL | Purpose | Status |
|---|---|---|
| `/projects` | All new projects, Sri Lanka wide | existing, rebuilt |
| `/projects/pre-construction` | Pre-construction / off-plan / upcoming projects | new |
| `/projects/colombo` | Colombo-specific projects | new |
| `/projects/colombo/luxury` | Colombo luxury apartments/condos | new |
| `/projects/branded-residences` | Branded residences | new |
| `/projects/villas` | New villa developments | new |
| `/projects/beachfront` | Beachfront/resort residences | new |
| `/projects/serviced-apartments` | Serviced apartments | new |
| `/projects/port-city-colombo` | Port City Colombo specific | new |
| `/guides` | Guides index (hub page, links the 3 guides below) | new |
| `/guides/foreigners-buying-property` | Foreign ownership guide | new |
| `/guides/investment-property` | Investment-focused guide | new |
| `/guides/golden-visa` | Golden visa / residency-by-investment guide | new |
| `/construction-companies` | Construction company directory | rebuilt (was a stub) |
| `/construction-companies/colombo` | Colombo-specific construction companies | new |
| `/construction-companies/swimming-pools` | Pool construction companies | new |
| `/construction-companies/consulting` | Construction consultants | new |

Config for all of these lives in code, not hardcoded per page:
- `/projects/*` — `src/lib/listing-categories.ts` (`projectCategories`)
- `/guides/*` — `src/lib/guides.ts` (`guides`)
- `/construction-companies/*` — `src/lib/construction-company-categories.ts` (`constructionCompanyPages`)

Each `page.tsx` is a thin wrapper: look up its config entry, fetch/filter data,
render the shared shell component. To add a new page in one of these three
families, add a config entry and a route file — do not duplicate the shell.

## Planned: city-first URL family (not built yet)

User flagged this as important for Google SEO — a **city-first** URL
pattern, distinct from the `/projects/{city}` pattern above:

```
/colombo/new-homes
/colombo/new-condos
/colombo/new-houses

/kandy/new-homes
/galle/new-homes
/negombo/new-homes
```

This needs a decision before building: does it replace `/projects/colombo`
style URLs, or coexist alongside them (risk of duplicate-content /
cannibalization between `/colombo/new-homes` and `/projects/colombo` if
both target the same query)? Likely resolution is a 301 from the old
pattern to the new one per city, or making `/projects/colombo` the canonical
and `/colombo/new-homes` a redirect — needs the user's call before
implementing. Tracked in `docs/roadmap.md` under "City-based SEO URL
structure".

## Keyword-to-page mapping

### /projects
New condominium projects sri lanka, New apartment projects sri lanka, New
development projects sri lanka, New Projects in Sri Lanka, New project in sri
lanka, Ongoing projects in sri lanka, New construction projects in sri lanka,
Housing projects in sri lanka

### /projects/pre-construction
Upcoming condo projects sri lanka, Pre construction condos sri lanka, Off plan
property sri lanka

### /projects/colombo
New apartment projects in colombo, Ongoing apartment projects in colombo,
Colombo new development real estate

### /projects/colombo/luxury
New luxury apartments colombo, New condominiums colombo, New apartments for
sale colombo

### /projects/branded-residences
Branded residences sri lanka

### /projects/villas
New villa developments sri lanka, New build homes sri lanka

### /projects/beachfront
Beachfront condo development sri lanka, New resort residences sri lanka

### /projects/serviced-apartments
New serviced apartments sri lanka

### /projects/port-city-colombo
Port city colombo apartments

### /guides/foreigners-buying-property
Condominium for sale sri lanka foreigners, Can foreigners buy condo in sri
lanka, Buy apartment in sri lanka as foreigner, Real estate investment sri
lanka for foreigners

### /guides/investment-property
Investment condo sri lanka, New construction sri lanka real estate

### /guides/golden-visa
Golden visa sri lanka property

### /construction-companies
Construction companies in sri lanka, Construction company sri lanka, Sri
lanka home construction company

### /construction-companies/colombo
Construction companies in colombo

### /construction-companies/swimming-pools
Swimming pool construction companies in sri lanka

### /construction-companies/consulting
Construction consultant companies in sri lanka

**Adding new keywords:** map each new keyword to the closest existing page
above (add it to that page's H1/intro/meta in the relevant config file). Flag
a keyword for a new page only if none of the existing pages are a reasonable
semantic fit.

## Category filter logic (how each /projects/* page decides what to show)

Filters run against the live project store (`getAllProjects()`), same data as
every other page — no separate data source. Defined in
`src/lib/listing-categories.ts`:

- **pre-construction** — status is "Coming Soon" or "Launching Soon"
- **colombo** — district is Colombo, or city/location contains "Colombo"
- **colombo/luxury** — Colombo filter AND (type is Condominium/Apartments OR
  starting price ≥ Rs. 40M) — a heuristic since there's no explicit "luxury"
  field; adjust the threshold in code as real inventory comes in
- **branded-residences** — name/description/type contains "branded residence"
- **villas** — type is "Villas"
- **beachfront** — city/location matches a known beach town, or
  description/location contains "beach"/"resort"
- **serviced-apartments** — name/description contains "serviced apartment"
- **port-city-colombo** — location/city/name contains "port city"

These are heuristics over free-text fields where the data model has no
dedicated tag. As the project catalogue grows, consider adding explicit
fields (e.g. a `tags: string[]` on `Project`) instead of text matching.

## SEO tactics checklist

1. **Server-rendered content** — every listing card's text (name, price,
   developer, beds, location) is rendered from server-fetched props, not
   populated client-side. Verified: raw HTML response includes project name
   and developer text with JS disabled. The map is a separate, lazy-loaded
   visual layer (`src/components/marketplace/map-pane.tsx`) and is never the
   only source of a project's text content.
2. **Unique per-page metadata** — every page above has its own title,
   description, and canonical, generated from its config entry
   (`buildCategoryMetadata`, `buildGuideMetadata`,
   `buildConstructionCompanyMetadata`).
3. **Canonical tags** — every category/guide/company page canonicals to its
   own clean path. `/projects` canonicals to `/projects` regardless of the
   legacy `?type=` query param.
4. **Path-based URLs** — all keyword-targeted pages above are real routes,
   not query-string variants. `?type=` on `/projects` remains as a secondary,
   non-canonical filter for backward compatibility with existing links.
5. **Sitemap** — `src/app/sitemap.ts` includes only the canonical path URLs
   listed above (plus individual project/developer detail pages). No
   query-param or view-toggle URLs are included.
6. **Structured data** —
   - `ItemList` on every listing/directory page, from the currently rendered
     list (`buildItemListJsonLd` in `src/lib/seo.ts`).
   - `BreadcrumbList` on every listing/guide/company page
     (`buildBreadcrumbJsonLd`).
   - `FAQPage` on guide pages with FAQs (`buildFaqJsonLd`).
   - `Product`/`Offer` schema already existed on individual project detail
     pages (`src/app/projects/[slug]/page.tsx`) — left as-is.
7. **Internal linking** — every category/guide/company page renders a
   "related pages" block linking to semantically adjacent pages (e.g.
   `/projects/colombo` links to `/projects/colombo/luxury` and
   `/projects/pre-construction`). Edit `relatedPaths` in each config file to
   change these.
8. **Breadcrumbs** — every new page renders visible breadcrumbs
   (`Home > New Projects > Colombo`) matched 1:1 with the `BreadcrumbList`
   JSON-LD (same array drives both).
9. **Image alt text** — project thumbnails use `"{name} in {location}"` alt
   text across listing cards (home shelf, search results, category pages).
10. **Content depth** — every category page has a real intro paragraph using
    natural keyword variants; every guide has multiple body sections plus an
    FAQ block targeting long-tail questions.
11. **Mobile performance** — the map pane is lazy-loaded via
    `next/dynamic(..., { ssr: false })` so it never blocks the initial paint;
    the list (real content) is always in the initial server HTML.
12. **robots.txt** — `src/app/robots.ts` disallows `?view=map` variants and
    any URL with multiple stacked query params, while leaving single-param
    URLs crawlable (canonical tags keep them out of the index without
    blocking crawl entirely).

## Known limitations / follow-ups

- **Map is a visual placeholder**, not a real map SDK (no Mapbox/Google Maps
  key configured). Pin positions are derived from project coordinates but
  aren't plotted on real geography. Swap in a real map provider inside
  `src/components/marketplace/map-pane.tsx` when ready — the surrounding
  page structure won't need to change.
- **Construction company data is placeholder seed data**
  (`src/data/construction-companies.ts`), same pattern as
  `src/data/projects.ts`. No admin CRUD UI exists for it yet (unlike
  developers/projects/neighborhoods) — add one following
  `src/lib/developer-store.ts` as a template if this becomes a real directory
  product.
- **Category filters are heuristic** (see above) because the current
  `Project` type has no explicit tags for "luxury," "branded residence," etc.
  Revisit once there's enough real inventory to validate the heuristics.
- Filter bar dropdowns (sale type/home type/price/beds/construction
  status) on `/projects/*` pages are currently cosmetic + client-side sort
  only, per the "don't touch underlying data fetching" constraint. Wiring
  them to actually filter the list is a follow-up, not done here.

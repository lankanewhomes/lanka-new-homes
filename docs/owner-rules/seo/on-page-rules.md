# On-page rules

| Element | Rule |
|---|---|
| Title | Keyword first, about 60-70 characters max, live count where it helps (e.g. `Property & Apartments for Sale in Sri Lanka: {n} New Projects`); developer profile default `{Name}: Projects, Prices & Contact`; neighbourhood `Houses & Land for Sale in {Name}: {n} New Homes` |
| Meta description | About 160 characters, starts with live counts, includes the keyword and a reason to click; a title/description set in the CMS SEO tab wins |
| H1 | One per page, matches the target keyword, plain sans heading, no eyebrow label above it |
| About text | Every category page renders an `about` text with natural keyword variants and links to related pages (the wrapper must pass it; it once did not) |
| Canonical | Every page canonicals to its own clean path; homepage canonicals to `www`; `/projects` ignores legacy `?type=` |
| Internal links | `relatedPaths` in each config; listing pages link to category pages and neighbourhoods; every new page is linked from somewhere crawlable |
| Breadcrumbs | Visible breadcrumbs and `BreadcrumbList` JSON-LD from the same array |
| Images | Alt text `"{name} in {location}"` on listing cards; descriptive alt on blog images |
| Text volume | Directory and hub pages need real text (about 300+ words), not just lists |
| Server rendering | Listing text must be in the first HTML response (no client-only text) |
| FAQs | Not on project, land or blog pages (owner removed them); neighbourhood pages and guides keep theirs |
| Numbers | Only published figures; never invent a market price (e.g. 1-acre land page uses published per-perch prices only) |
| Share tags | Use `withSocial` / `socialMetadata` in `src/lib/seo.ts`; never hand-write a partial `openGraph`; default image `public/og-default.jpg` (1200x630) |
| Brand name | Site name is "LankaNewHomes" (alternate "Lanka New Homes"); one address, `www` |

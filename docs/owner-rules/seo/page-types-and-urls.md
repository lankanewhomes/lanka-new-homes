# Page types and URL patterns

| Family | URL pattern | Config / code |
|---|---|---|
| Project categories | `/projects/{category}` (colombo, luxury, villas, beachfront, lakefront, pre-construction, branded-residences, serviced-apartments, port-city-colombo, brand-new-houses-for-sale, gated-community-houses-for-sale...) | `src/lib/listing-categories.ts` (`projectCategories`) |
| Colombo postcodes | `/projects/colombo/colombo-{1..15}` | `src/lib/colombo-postcode-pages.ts` |
| Town / modifier pages | `/projects/houses-for-sale-in-{town}`, `/projects/apartments-for-sale-in-{town}`, `/projects/{modifier}-apartments-for-sale-in-colombo` | `listing-categories.ts` |
| Land pages | `/land`, `/land/{slug}`, `/land/district/{district}`, `/land/{keyword-slug}` | `src/lib/land-seo-pages.tsx` |
| Postal codes | `/postal-codes`, `/postal-codes/{district}`, `/postal-codes/{district}/{town}` | `src/lib/postal-codes.ts` (static data from `src/data/cities.json`) |
| Neighbourhoods | `/neighborhoods`, `/neighborhoods/{slug}` | Neighborhoods collection |
| Guides | `/guides`, `/guides/{slug}` | `src/lib/guides.ts` |
| Blog | `/blog`, `/blog/{slug}` | `src/lib/blog.ts` |
| Directories | `/construction-companies/*`, `/architects`, `/interior-designers`, `/marketing-companies`, `/sales-companies`, `/developers` | their config files |
| Machine-readable | `/llms.txt`, `/llms/projects/{slug}.md`, `/llms/land/{slug}.md` | `src/lib/listing-markdown.ts` |

| Rule | Detail |
|---|---|
| Add a page | Add a config entry + a thin route file; never copy the shell component |
| Path URLs | Keyword pages are real paths, never query strings; `?type=` stays only as a non-canonical filter |
| Empty pages | A page with 0 listings is `noindex` and left out of the sitemap until it has one (postcodes, farm land) |
| Thin pages | A page with 1 listing is allowed but flagged "thin"; prefer building after more listings |
| Duplicates | Avoid two pages for the same query; the planned `/colombo/new-homes` city-first family is NOT built and needs the owner's decision (replace vs coexist vs 301) |
| Redirects | Bare domain 301s to `www`; do any new redirect as a Cloudflare rule when it is host-based |
| Update the map | Every new page is added to `docs/seo-strategy.md` with volume and date |

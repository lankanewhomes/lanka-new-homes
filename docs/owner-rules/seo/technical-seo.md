# Technical SEO

| Area | Rule |
|---|---|
| Sitemap | `src/app/sitemap.ts`, refreshed hourly (`revalidate`); includes only canonical path URLs plus listing, developer, land, neighbourhood and directory profile pages; no query or view-toggle URLs. Check any new entity type is added (partner directories and neighbourhoods were once missing) |
| robots | `src/app/robots.ts` blocks `?view=map` and URLs with stacked query params (`/*?*&*`). Never link internally to a URL that robots blocks (homepage popular-searches once did) |
| Redirects | `lankanewhomes.com/*` 301 to `www.lankanewhomes.com/*`; host-based redirects go in Cloudflare Redirect Rules, not `next.config.ts` (a config redirect caused a 308 loop) |
| Structured data | `ItemList` on listing pages, `BreadcrumbList` on listing/guide/company pages, `Product`/`RealEstateListing` with PostalAddress, GeoCoordinates, datePosted and seller on project and land pages, `WebSite` (name LankaNewHomes) on home, `BlogPosting` on posts, `FAQPage` only on guides and neighbourhoods |
| Metadata | Unique title, description and canonical per page from its config entry (`buildCategoryMetadata`, `buildGuideMetadata`...) |
| Speed | Map pane is lazy-loaded; the list is in the initial HTML; images served from pre-shrunk R2 copies (`npm run images:presize` after adding photos) |
| Caching | Pages are cached (ISR); after a data change a page can show an old copy until the next deploy. Verify the live page |
| Cloudflare | If AI or search bots are blocked, check Cloudflare > Security > Bots as well as robots.txt |
| Audit | Ubersuggest `site_audit` and `pagespeed_audit` after each round; fix flags, note ones left alone on purpose (e.g. "non-friendly URL" on /neighborhoods) |
| Indexing | Owner submits the sitemap and requests indexing in Search Console (no access from here) |

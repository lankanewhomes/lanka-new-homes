# SEO workflow for any keyword or page task

| Step | Do |
|---|---|
| 1. Read | `seo-todo.md`, then the relevant row in `docs/seo-strategy.md` |
| 2. Research with tools | Ubersuggest `keyword_suggestions`, `keyword_metrics` (volume, difficulty), `serp_analysis` (who ranks), `domain_keywords` on lankanewhomes.com (what we already hold), `page_overview`; AI SEO Crew `find_keyword_ideas`, `check_page_seo`. If a tool needs sign-in or is down, say so; never skip silently |
| 3. Decide | Build a page only if there is real volume AND at least 1-2 real listings; otherwise note it as "not built" with the reason |
| 4. Build | Add a config entry and a thin route (see `page-types-and-urls.md`); title and description from live data; real about text; links to related pages |
| 5. Sitemap | Confirm the page is in `src/app/sitemap.ts` (a good page can still be missing) |
| 6. Verify locally | Open the page; view source: title, description, canonical, H1, JSON-LD present |
| 7. Push and wait for deploy | Then fetch the live page and check the same things |
| 8. After | Run `check_page_seo` / `page_overview` on the new URLs; run `site_audit` in a day or two; fix what is flagged |
| 9. Record | Add the page to `docs/seo-strategy.md` with volume and date; update `seo-todo.md`; save a memory note |
| Tool limits | Ubersuggest quota is 100 lookups per day; volumes are global, not Sri Lanka only |

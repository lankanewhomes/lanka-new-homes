# SEO: index (read this first for any SEO task)

Standing instruction (owner, 2026-11-15): **when the owner asks about SEO, first show `seo-todo.md` as a short table ("what we need to do"), then continue.**
Standing instruction (owner, 2026-11-24): **"when I add listings, go and check and find more pages we can rank for."** After the owner
adds or publishes listings (or says so), run `node scripts/seo-page-gaps.mjs` (reads the live site, changes nothing; in a cloud session
prefix `NODE_USE_ENV_PROXY=1`). It lists the towns that now have enough open listings for a town page that does not exist yet. Check each
one's volume in Ubersuggest (Sri Lanka), build the ones with real volume, push, and report in a table what was built and what was not.
Always use the SEO tools (Ubersuggest, AI SEO Crew) before building and after (owner, 2026-11-13: "you always check ubersuggest and some seo tools you use to do it right"). Never guess volumes.

| File | Read it when |
|---|---|
| `seo-todo.md` | The owner asks about SEO or "what is left" |
| `seo-workflow.md` | Starting any keyword page or SEO change (research, build, verify) |
| `page-types-and-urls.md` | Adding or changing a page, URL or category |
| `on-page-rules.md` | Titles, descriptions, H1, headings, links, images, breadcrumbs |
| `technical-seo.md` | Sitemap, robots, canonical, redirects, structured data, caching |
| `keyword-research-and-targets.md` | Choosing keywords, volumes, what is built and what is not |
| `content-blog-and-guides.md` | Blog posts, guides, neighbourhood text |
| `ai-search.md` | ChatGPT / Perplexity / Claude / Gemini visibility |
| `backlinks-and-offpage.md` | Backlinks, Search Console, authority |

Long reference (source of truth for which URL targets which keyword): `docs/seo-strategy.md` (update it whenever a page is added), `docs/seo-opportunities-2026-11-02.md`, `SEO_KEYWORDS.md`.

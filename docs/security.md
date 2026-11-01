# Security and scraping protection

Last reviewed 2026-11-01 (owner: "protect my website from people scraping data, security").

## In the code

| Protection | Where |
|---|---|
| Create / edit / delete routes for projects, lands, neighbourhoods, developers, construction companies and the partner directories need a signed-in CMS **admin** (401 / 403 otherwise). Before 2026-11-01 they had no check. | `src/lib/api-guard.ts` (`requireAdmin`), called first in every non-GET handler under `src/app/(frontend)/api/` and `src/lib/company-profile-api.ts` |
| Image upload needs any signed-in person (CMS user or website account) | `requireSignedIn`, `api/uploads/image` |
| Per-visitor request limits on the public forms: contact 5 per 15 min, enquiries 8 per 15 min, reviews 5 per hour, uploads 20 per 10 min, domain-verify 20 per 15 min | `src/lib/rate-limit.ts` |
| Browser headers on every page: HSTS (1 year), nosniff, SAMEORIGIN framing, strict referrer, camera / mic / payment off; `x-powered-by` removed | `next.config.ts` `headers()` |
| AI-training crawlers disallowed | `robots.txt` (Cloudflare managed + our list) |
| Lead reply links are signed; cron routes need `CRON_SECRET`; mail routes are admin only | existing |

Note: the in-code rate limit counts inside one running Worker instance, so it stops one script hammering a form but is not a hard global cap. The Cloudflare rules below are the real limit.

## In the Cloudflare dashboard (owner does these; they change security settings)

1. **Security → Bots → Bot Fight Mode: on.** Blocks known scraper and headless-browser traffic. Keep "Verified bots" (Google, Bing) allowed.
2. **Security → WAF → Rate limiting rule** for `/api/*`: 60 requests per minute per IP, action "Managed Challenge" (or Block for 10 minutes).
3. **Rate limiting rule** for the forms: `POST /api/leads`, `/api/contact`, `/api/reviews`: 10 per 10 minutes per IP, action Block.
4. **WAF → Custom rule** to challenge `/payload-api/*` and `/admin*` from outside Sri Lanka and Canada (the owner's countries), or add Cloudflare Access in front of `/admin`.
5. **Turnstile** (free CAPTCHA replacement) on the enquiry and contact forms if spam still gets through. Needs a site key and secret key.
6. **SSL/TLS → Always Use HTTPS: on; Minimum TLS 1.2.**
7. Turn on **2-step verification** for the Cloudflare, GitHub, Supabase, Google and Zoho accounts.

## Honest limits

Anything a visitor can see in a browser can be copied by a determined person; the goal is to make bulk copying slow and expensive, and to stop writes. Public pages and the sitemap must stay readable for Google.

## Payload REST access (`/payload-api/*`), reviewed 2026-11-01 from the access rules in `src/collections`

| Collection | Before | Now |
|---|---|---|
| Leads, Analytics, Reviews | anyone could create through the REST route (fake analytics, form spam that skipped the rate limits) | admin only; visitors still submit through `/api/leads`, `/api/reviews` and the event routes, which write server-side |
| Media | any signed-in account, even a plain buyer, could upload, replace and delete every file | uploads: admin, developer, construction company; replace / delete: admin only |
| Users | anyone may register (needs email confirmation); `role` cannot be raised to admin by a non-admin; read / update own record only | unchanged |
| Plan waitlist | anyone may create (the "Get early access" button posts here) | unchanged: cover it with the Cloudflare rate-limit rule for `POST /payload-api/plan-waitlist` |
| Everything else (mail, outreach, payments, SEO keywords, social assets...) | admin only or owner only | unchanged |

Checked by reading the rules, not by signing in as a buyer. To prove it, sign in with a throwaway buyer account and request `/payload-api/leads`, `/payload-api/users` and `/payload-api/media/<id>` (DELETE): you should get empty / 403.

## Content-Security-Policy

Running in **report-only** mode since 2026-11-01 (`CSP_REPORT_ONLY` in `next.config.ts`): the browser logs what it would block and blocks nothing. After a week of normal browsing with the console open (and checking GA4, Meta Pixel, Clarity, YouTube and map embeds still work), rename the header to `Content-Security-Policy`. `'unsafe-inline'` and `'unsafe-eval'` stay for now because Next.js and the tracking snippets use them.

## Next steps (not done)

- The Cloudflare and 2-step-verification items above are the owner's to do.
- Public `GET /api/projects` etc. return full listing data; trim fields or cache at Cloudflare if scraping of those becomes a problem.

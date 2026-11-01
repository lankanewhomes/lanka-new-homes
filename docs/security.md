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

## Next steps (not done)

- Content-Security-Policy: trial as `Content-Security-Policy-Report-Only` first; Google Analytics, Meta Pixel, Clarity and the video / map embeds all need allowing.
- Check Payload's access rules for the `leads`, `users` and `analytics` collections at `/payload-api/*` (needs a signed-in test, not done from code reading alone).
- Public `GET /api/projects` etc. return full listing data; trim fields or cache at Cloudflare if scraping of those becomes a problem.

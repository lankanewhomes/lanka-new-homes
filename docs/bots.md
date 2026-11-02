# Bot handling and the Bots page

Owner request, 2 Nov 2026: GA4 showed fake "users" from data-centre towns (Prineville, Luleå, Boardman). Rule #1: search engines, social previews and AI search must never be blocked or limited.

## Where everything is

| What | Where |
|---|---|
| ALL bot lists and matching (allowlist, blocklist, generic patterns, GA skip pattern, robots lists) | `src/lib/bots.ts` (`classifyBot(userAgent)` returns `{ isBot, name, category, action }`) |
| 403 for the blocklist, logging of every bot visit | `src/middleware.ts` |
| The write to Supabase (never awaited, never throws) | `src/lib/bot-log.ts` calling `increment_bot_hit()` |
| Table and function | `supabase/migrations/20261102120000_bot_daily_stats.sql` (`bot_daily_stats`, one row per day, bot and allowed/blocked; RLS on with no policies, so only the server's service role can read or write) |
| Bots page (admin only) | `/dashboard/analytics/bots` (also reachable as `/admin/bots`), endpoint `/payload-api/site-report/bots` |
| Google Analytics skips bots | `src/components/analytics/deferred-google-tags.tsx` |
| robots.txt | `src/app/robots.ts` |
| Form limits | `src/lib/rate-limit.ts` (allowlisted bots are never limited) |

## Rules

- Allowlist first and always allowed: Googlebot, Google-InspectionTool, GoogleOther, Storebot-Google, AdsBot-Google, Bingbot, BingPreview, msnbot, DuckDuckBot, YandexBot, Applebot, Baiduspider; facebookexternalhit, Facebot, meta-externalagent, Twitterbot, LinkedInBot, WhatsApp, TelegramBot, Slackbot, Discordbot, Pinterestbot; GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, ClaudeBot, Claude-User, Claude-SearchBot, Google-Extended, Applebot-Extended, Amazonbot, CCBot.
- Blocked (403): AhrefsBot, SemrushBot, MJ12bot, DotBot, BLEXBot, PetalBot, Bytespider, DataForSeoBot, serpstatbot, MegaIndex, ZoominfoBot. Nothing else is ever blocked.
- Fail open: any error means the request goes through. An empty user-agent is allowed and logged as "unknown". Normal browsers are never blocked, even from a data centre or a VPN.
- Google Analytics is not loaded for bot-like user-agents (bot, crawl, spider, slurp, headless, preview, fetch, monitor, lighthouse, pingdom, uptime, python-requests, curl, wget, axios, go-http-client) or when `navigator.webdriver` is true. CUBOT phones are not treated as bots.
- Not logged: `_next/static`, images, favicon, robots.txt, sitemap.xml, and the Worker's own cron calls (`/api/cron/`, `/api/mail/`).
- Form limits (enquiries 30 per 15 minutes, contact 10 per 15 minutes, brochure-download event 60 per 10 minutes, reviews, uploads) count per visitor IP; phone networks put many real buyers behind one address, so the lead limit is deliberately generous. Page views are never limited.
- The allowlist is matched on the user-agent text, so anyone can pretend to be Googlebot. That is accepted: the allowlist exists to never hurt real search engines. Real Googlebot can be verified by reverse DNS if ever needed.

## Found while building this

- The old root `middleware.ts` (Supabase session refresh) was never loaded: with the `src/` layout Next only reads `src/middleware.ts`. It was not switched on (it would change how logins behave); the file now only does bot handling.
- Cloudflare's own settings sit in front of this code. In the dashboard, "AI Crawl Control / managed robots.txt", "Block AI bots" and "Bot Fight Mode" can disallow or challenge GPTBot, ClaudeBot, Google-Extended, CCBot and others no matter what the site says. The live robots.txt showed Cloudflare's managed block disallowing those AI bots on 2 Nov 2026. Turn those off (or set them to allow) if AI search traffic matters; keep "verified bots" allowed.

## Check it

```
curl -s -o /dev/null -w "%{http_code}\n" -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" https://www.lankanewhomes.com/about   # 200
curl -s -o /dev/null -w "%{http_code}\n" -A "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)" https://www.lankanewhomes.com/about          # 403
```

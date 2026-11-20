# AI assistants (ChatGPT, Perplexity, Claude, Gemini)

| Item | Rule |
|---|---|
| Crawler access | `robots.ts` allows OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User and the training bots; private areas stay disallowed. A Cloudflare bot rule can still block them |
| `/llms.txt` | Live map of the site with price, units/plots and a link to each listing's markdown |
| Markdown per listing | `/llms/projects/<slug>.md` and `/llms/land/<slug>.md`, advertised with `<link rel="alternate" type="text/markdown">` |
| Structured data | PostalAddress, GeoCoordinates, datePosted, seller; land without a whole-parcel price exposes price per perch, plot size and plot count |
| Server HTML | Facts must be in the first HTML response (AI crawlers do not reliably run JavaScript) |
| Traffic | Visitors from chatgpt.com, perplexity.ai, claude.ai, gemini.google.com, copilot.microsoft.com or `utm_source=chatgpt.com` are stored as `ai_assistant`; GA4 still lists them as referral (create a custom channel group there) |
| Not done on purpose | No FAQ blocks on project, land or blog pages (owner, 2026-10-16) |

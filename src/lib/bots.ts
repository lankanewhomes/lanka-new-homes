// ONE place for every bot rule on the site (owner, 2026-11-02): who is always let in, who is turned away, how a visit is classified for
// the bot stats page, and which visitors must not be counted by Google Analytics.
//
// RULE #1: search engines, social-preview fetchers and AI search / assistant bots are NEVER blocked or rate-limited. The allowlist is
// checked first, and every error or doubt means "allow" (fail open). Real browsers are never blocked, even from a data centre or a VPN.
// Only the short blocklist of SEO-tool and scraper bots below gets a 403. An empty user-agent is let through and logged as "unknown".

export type BotCategory = "search-engine" | "social-preview" | "ai-search" | "seo-scraper" | "monitor" | "unknown-bot";
export type BotAction = "allowed" | "blocked";
export type BotClassification = { isBot: boolean; name: string; category: BotCategory | null; action: BotAction };

/** Always allowed, full access. Matched as a case-insensitive part of the user-agent. */
export const ALLOWLIST: { name: string; category: BotCategory }[] = [
  ...["Googlebot", "Google-InspectionTool", "GoogleOther", "Storebot-Google", "AdsBot-Google", "Bingbot", "BingPreview", "msnbot", "DuckDuckBot", "YandexBot", "Applebot", "Baiduspider"].map((name) => ({ name, category: "search-engine" as const })),
  ...["facebookexternalhit", "Facebot", "meta-externalagent", "Twitterbot", "LinkedInBot", "WhatsApp", "TelegramBot", "Slackbot", "Discordbot", "Pinterestbot"].map((name) => ({ name, category: "social-preview" as const })),
  ...["GPTBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Perplexity-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "Google-Extended", "Applebot-Extended", "Amazonbot", "CCBot"].map((name) => ({ name, category: "ai-search" as const })),
];

/** The only bots that get a 403: SEO-tool crawlers and scrapers that bring the site nothing. */
export const BLOCKLIST = ["AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "BLEXBot", "PetalBot", "Bytespider", "DataForSeoBot", "serpstatbot", "MegaIndex", "ZoominfoBot"] as const;

// Other automated visitors: logged (allowed) so they show on the stats page, never blocked.
const MONITOR_PATTERN = /monitor|pingdom|uptime|lighthouse|pagespeed|gtmetrix/i;
// "(?<!cu)" keeps CUBOT phones (a phone brand whose user-agent contains "cubot") from being treated as a bot.
const GENERIC_BOT_PATTERN = /(?<!cu)bot|crawl|spider|slurp|headless|preview|fetch|python-requests|curl|wget|axios|go-http-client/i;

/** Visitors Google Analytics must skip (owner's list), plus the browser's own automation flag, checked by `shouldSkipAnalytics`. */
export const ANALYTICS_SKIP_PATTERN = /(?<!cu)bot|crawl|spider|slurp|headless|preview|fetch|monitor|lighthouse|pingdom|uptime|python-requests|curl|wget|axios|go-http-client/i;

const lower = (value: string) => value.toLowerCase();
const ALLOW_LOWER = ALLOWLIST.map((entry) => ({ ...entry, token: lower(entry.name) }));
const BLOCK_LOWER = BLOCKLIST.map((name) => ({ name, token: lower(name) }));

/** What kind of visitor is this? Never throws: any problem returns "not a bot, allowed". */
export function classifyBot(userAgent: string | null | undefined): BotClassification {
  const notBot: BotClassification = { isBot: false, name: "", category: null, action: "allowed" };
  try {
    const ua = (userAgent ?? "").trim();
    if (!ua) return { isBot: true, name: "unknown", category: "unknown-bot", action: "allowed" }; // empty UA: logged, never blocked
    const text = lower(ua);

    // 1. Allowlist first. The longest token wins, so "Applebot-Extended" is named as itself and not as "Applebot".
    let allowed: (typeof ALLOW_LOWER)[number] | undefined;
    for (const entry of ALLOW_LOWER) if (text.includes(entry.token) && (!allowed || entry.token.length > allowed.token.length)) allowed = entry;
    if (allowed) return { isBot: true, name: allowed.name, category: allowed.category, action: "allowed" };

    // 2. The blocklist.
    const blocked = BLOCK_LOWER.find((entry) => text.includes(entry.token));
    if (blocked) return { isBot: true, name: blocked.name, category: "seo-scraper", action: "blocked" };

    // 3. Everything else that looks automated: logged and allowed.
    if (MONITOR_PATTERN.test(ua)) return { isBot: true, name: genericName(ua) || "monitor", category: "monitor", action: "allowed" };
    if (GENERIC_BOT_PATTERN.test(ua)) return { isBot: true, name: genericName(ua) || "other bot", category: "unknown-bot", action: "allowed" };
    return notBot;
  } catch {
    return notBot; // fail open
  }
}

function genericName(ua: string): string {
  const named = ua.match(/([A-Za-z0-9._-]*(?:bot|crawler|spider|monitor|lighthouse|pingdom|uptime)[A-Za-z0-9._-]*)/i);
  if (named) return named[1].slice(0, 60);
  const tool = ua.match(/\b(python-requests|curl|wget|axios|go-http-client|HeadlessChrome|headless)\b/i);
  return tool ? tool[1].slice(0, 60) : "";
}

/** Search engines, social previews and AI assistants: the traffic that must never be limited or blocked. */
export function isGoodBotCategory(category: BotCategory | null): boolean {
  return category === "search-engine" || category === "social-preview" || category === "ai-search";
}

/** Server: is this request from an allowlisted bot (so it skips every limit)? Fails open to false. */
export function isAllowlistedRequest(request: Request): boolean {
  try {
    return isGoodBotCategory(classifyBot(request.headers.get("user-agent")).category);
  } catch {
    return false;
  }
}

/** Browser: should Google Analytics stay unloaded for this visitor? Bots and automated browsers only. */
export function shouldSkipAnalytics(userAgent: string | null | undefined, webdriver: boolean | undefined): boolean {
  if (webdriver) return true;
  return ANALYTICS_SKIP_PATTERN.test(userAgent ?? "");
}

/** robots.txt: the user-agent names to Disallow. */
export const ROBOTS_DISALLOWED_BOTS: readonly string[] = BLOCKLIST;
/** robots.txt: the allowlisted names, spelled out so every one is named as welcome. */
export const ROBOTS_ALLOWED_BOTS: readonly string[] = ALLOWLIST.map((entry) => entry.name);

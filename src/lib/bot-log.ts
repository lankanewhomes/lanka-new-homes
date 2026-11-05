import type { BotClassification } from "@/lib/bots";

// Records one bot visit (src/lib/bots.ts decides what counts) by calling the increment_bot_hit() function in Supabase, which adds one to the
// day's row for that bot. Plain fetch, so it works in the edge middleware. It NEVER throws and is always started without being waited on
// (middleware passes it to event.waitUntil), so a logging problem can never slow or break a page.

const SKIP_PREFIXES = ["/_next/", "/api/cron/", "/api/mail/", "/robots.txt", "/sitemap.xml", "/favicon.ico"];
const ASSET = /\.(?:svg|png|jpe?g|gif|webp|avif|ico|css|js|mjs|map|woff2?|ttf|otf|txt|xml|json|webmanifest)$/i;

export function shouldLogPath(path: string): boolean {
  return !SKIP_PREFIXES.some((prefix) => path.startsWith(prefix)) && !ASSET.test(path);
}

export async function logBotHit(bot: BotClassification, path: string): Promise<void> {
  try {
    if (!bot.isBot || !bot.category || !shouldLogPath(path)) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
      await fetch(`${url}/rest/v1/rpc/increment_bot_hit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
        body: JSON.stringify({ p_bot_name: bot.name, p_category: bot.category, p_action: bot.action, p_path: path }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  } catch {
    /* never let logging affect a visitor */
  }
}

import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { classifyBot } from "@/lib/bots";
import { logBotHit } from "@/lib/bot-log";

// Bot handling (owner, 2026-11-02; every rule lives in src/lib/bots.ts):
//   - search engines, social previews and AI assistants (the allowlist) always pass, untouched: no block, no limit;
//   - a short list of SEO-tool scrapers (AhrefsBot, SemrushBot...) gets a 403;
//   - every bot visit, allowed or blocked, is counted for /dashboard/analytics/bots without waiting for it (event.waitUntil);
//   - any error in this file lets the request through (fail open). A normal browser is never touched.
//
// History: this file used to sit in the project root and refresh the Supabase login cookie. With the src/ folder layout Next only loads
// middleware from src/, so that root file was never run (found 2026-11-02). It was NOT switched on here: it would add a Supabase call to
// every page and change how logins behave. If it is ever wanted, add it back below with its own test.
export function middleware(request: NextRequest, event: NextFetchEvent) {
  try {
    const bot = classifyBot(request.headers.get("user-agent"));
    if (bot.isBot) {
      const logging = logBotHit(bot, request.nextUrl.pathname); // started now, never awaited, never throws
      try { event.waitUntil(logging); } catch { /* no waitUntil here: it still runs */ }
      if (bot.action === "blocked") {
        return new NextResponse("Forbidden", { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
      }
    }
  } catch {
    /* fail open: carry on as a normal visitor */
  }
  return NextResponse.next();
}

// Not run for static files, images, favicon, robots.txt or sitemap.xml: those are never blocked and never logged.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff2?|ttf|map)$).*)",
  ],
};

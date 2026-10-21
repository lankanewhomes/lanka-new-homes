import { NextResponse, type NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "../../../../../payload.config";
import { verifyEmailClick } from "@/lib/email-tracking";
import { classifyDeviceType } from "@/lib/analytics-event";

// Tracked link used in platform emails (src/lib/email-tracking.ts): /e/<trackId>?u=<link>&b=<button>&s=<signature>
// Records the click on that email's row in the email log, then forwards to the link. The signature covers the link, so only links we
// put in an email can be reached. A database hiccup never blocks the redirect. Mail scanners and link previewers are not counted.
export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|preview|scanner|safelinks|proofpoint|mimecast|barracuda|headless|curl|python|go-http|java\//i;

function page(url: string, label: string) {
  const safe = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return new NextResponse(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${label}</title>
<style>body{margin:0;background:#f5f5f0;font-family:Helvetica,Arial,sans-serif;color:#1f1f1f}main{max-width:420px;margin:48px auto;padding:28px 24px;background:#fff;text-align:center}a.btn{display:inline-block;margin-top:14px;padding:12px 24px;background:#f47b36;color:#1c1c20;font-weight:700;text-decoration:none}</style></head>
<body><main><p>${label}…</p><a class="btn" href="${safe}">${label}</a><script>setTimeout(function(){window.location.href=${JSON.stringify(url).replace(/</g, "\\u003c")}},300)</script></main></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sp = request.nextUrl.searchParams;
  const url = sp.get("u") ?? "";
  const button = sp.get("b") ?? "";
  const token = sp.get("s") ?? "";
  if (!/^[A-Za-z0-9_-]{8,24}$/.test(id) || !url || !token || !verifyEmailClick(id, url, button, token)) {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin), 302);
  }

  const ua = request.headers.get("user-agent") ?? "";
  if (!BOT.test(ua)) {
    try {
      await Promise.race([
        (async () => {
          const payload = await getPayload({ config });
          const pool = (payload.db as unknown as { pool: { query: (text: string, values: unknown[]) => Promise<unknown> } }).pool;
          const click = { button, url: /^https?:/i.test(url) ? url.slice(0, 300) : url.replace(/[?].*$/, "").slice(0, 120), at: new Date().toISOString(), device: classifyDeviceType(ua) };
          await pool.query(
            `update payload.email_log
                set click_count = coalesce(click_count, 0) + 1,
                    first_clicked_at = coalesce(first_clicked_at, now()),
                    clicks = coalesce(clicks, '[]'::jsonb) || $2::jsonb
              where track_id = $1`,
            [id, JSON.stringify([click])],
          );
        })(),
        new Promise((resolve) => setTimeout(resolve, 6000)),
      ]);
    } catch (error) {
      console.error("email click not recorded:", error instanceof Error ? error.message : error);
    }
  }

  if (/^https?:/i.test(url)) return NextResponse.redirect(url, 302);
  return page(url, button || "Continue");
}

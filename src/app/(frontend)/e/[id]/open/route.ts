import { NextResponse, type NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "../../../../../../payload.config";

// Open-tracking pixel used in platform emails (src/lib/email-tracking.ts): /e/<trackId>/open
// Counts one open on that email's row in the email log and returns a 1x1 transparent GIF. Opens are approximate: Apple Mail and some
// other clients load images in advance, and clients that block images never load it. A database hiccup never blocks the image.
export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|scanner|safelinks|proofpoint|mimecast|barracuda|headless|curl|python|go-http|java\//i;
const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

const pixel = () =>
  new NextResponse(GIF, { headers: { "Content-Type": "image/gif", "Cache-Control": "no-store, max-age=0", "Content-Length": String(GIF.length) } });

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{8,24}$/.test(id)) return pixel();

  const ua = request.headers.get("user-agent") ?? "";
  if (!BOT.test(ua)) {
    try {
      await Promise.race([
        (async () => {
          const payload = await getPayload({ config });
          const pool = (payload.db as unknown as { pool: { query: (text: string, values: unknown[]) => Promise<unknown> } }).pool;
          await pool.query(
            `update payload.email_log
                set open_count = coalesce(open_count, 0) + 1,
                    first_opened_at = coalesce(first_opened_at, now())
              where track_id = $1`,
            [id],
          );
        })(),
        new Promise((resolve) => setTimeout(resolve, 6000)),
      ]);
    } catch (error) {
      console.error("email open not recorded:", error instanceof Error ? error.message : error);
    }
  }
  return pixel();
}

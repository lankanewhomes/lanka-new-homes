import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

// Rendered pages (ISR, `export const revalidate = 60`) are kept in an R2 bucket and in Cloudflare's regional cache, so a visit
// does not re-render the page from the database every time. Without this the Cloudflare build was 3-5x slower than Vercel.
// "short-lived" (a minute) instead of "long-lived" (up to 30 minutes per region, 2026-10-11): with long-lived, an edit made in the CMS
// took up to half an hour to show on the live page. A minute keeps edits quick and still avoids re-rendering on every visit.
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "short-lived" }),
  queue: memoryQueue,
});

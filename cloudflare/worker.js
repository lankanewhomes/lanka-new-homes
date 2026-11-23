// Cloudflare Worker entry: the OpenNext Next.js worker plus Cron Triggers.
// Replaces Vercel Cron (vercel.json). Each trigger calls the existing /api/cron/* route with the same
// `Authorization: Bearer $CRON_SECRET` header those routes already check.
import { connect } from "cloudflare:sockets";
import openNextWorker from "../.open-next/worker.js";
import { withImageFallback } from "./image-fallback.js";

// Shared with cloudflare/pg-cloudflare-socket.cjs (node-postgres on Workers).
globalThis.__cfSocketsConnect = connect;

const CRON_ROUTES = {
  "0 8 * * 1": "/api/cron/analytics-digest", // Mondays 08:00 UTC
  "0 2 * * *": "/api/cron/subscription-expiry", // daily 02:00 UTC
  "0 */6 * * *": "/api/cron/bay-one-availability", // every 6 hours: Bay One units sold / available
  "30 3 * * *": "/api/cron/social-sync", // daily 03:30 UTC (9:00 in Sri Lanka): import Instagram/Facebook posts, reels, videos and stories and match them to listings
  "*/5 * * * *": "/api/mail/sync", // every 5 minutes: the mailbox -> CMS mail sync (does nothing while MAIL_MOCK_MODE is on)
  "3-58/5 * * * *": "/api/cron/social-publish", // every 5 minutes (offset): post any scheduled Instagram / Facebook post that is due
  "*/10 * * * *": "/api/cron/lead-alert-sweep", // every 10 minutes: email any recent lead whose instant alert never went out
};

const WEEKLY_REPORT_TICK = "30 3 * * *";

// Hyperdrive's per-request connection string, read by payload.config.ts when it opens its database pool.
const useHyperdrive = (env) => {
  if (env && env.HYPERDRIVE && env.HYPERDRIVE.connectionString) globalThis.__cfHyperdriveUrl = env.HYPERDRIVE.connectionString;
};

export default {
  fetch(request, env, ctx) {
    useHyperdrive(env);
    // /_next/image: ready-shrunk copy from our storage first, then Cloudflare's resizer, then the original file (see image-fallback.js).
    return withImageFallback(request, () => openNextWorker.fetch(request, env, ctx));
  },
  async scheduled(controller, env, ctx) {
    useHyperdrive(env);
    const path = CRON_ROUTES[controller.cron];
    if (!path) return;
    const call = (p) =>
      openNextWorker
        .fetch(new Request(`https://www.lankanewhomes.com${p}`, { headers: { authorization: `Bearer ${env.CRON_SECRET}` } }), env, ctx)
        .then((res) => console.log(`cron ${p} -> ${res.status}`));
    ctx.waitUntil(call(path));
    // Developer weekly report: Sundays only, on the daily 03:30 UTC tick (9:00 am in Sri Lanka). Rides an existing trigger instead of
    // adding a new one (owner, 2026-11-22: "every sunday we need to send").
    if (controller.cron === WEEKLY_REPORT_TICK && new Date(controller.scheduledTime).getUTCDay() === 0) {
      ctx.waitUntil(call("/api/cron/developer-weekly-report"));
    }
  },
};


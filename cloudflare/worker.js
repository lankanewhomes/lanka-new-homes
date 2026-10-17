// Cloudflare Worker entry: the OpenNext Next.js worker plus Cron Triggers.
// Replaces Vercel Cron (vercel.json). Each trigger calls the existing /api/cron/* route with the same
// `Authorization: Bearer $CRON_SECRET` header those routes already check.
import { connect } from "cloudflare:sockets";
import openNextWorker from "../.open-next/worker.js";

// Shared with cloudflare/pg-cloudflare-socket.cjs (node-postgres on Workers).
globalThis.__cfSocketsConnect = connect;

const CRON_ROUTES = {
  "0 8 * * 1": "/api/cron/analytics-digest", // Mondays 08:00 UTC
  "0 2 * * *": "/api/cron/subscription-expiry", // daily 02:00 UTC
  "0 */6 * * *": "/api/cron/bay-one-availability", // every 6 hours: Bay One units sold / available
  "30 3 * * *": "/api/cron/social-sync", // daily 03:30 UTC (9:00 in Sri Lanka): import Instagram/Facebook posts, reels, videos and stories and match them to listings
  "*/5 * * * *": "/api/mail/sync", // every 5 minutes: Zoho -> CMS mail sync (does nothing while MAIL_MOCK_MODE is on)
  "3-58/5 * * * *": "/api/cron/social-publish", // every 5 minutes (offset): post any scheduled Instagram / Facebook post that is due
  "*/10 * * * *": "/api/cron/lead-alert-sweep", // every 10 minutes: email any recent lead whose instant alert never went out
};

// Hyperdrive's per-request connection string, read by payload.config.ts when it opens its database pool.
const useHyperdrive = (env) => {
  if (env && env.HYPERDRIVE && env.HYPERDRIVE.connectionString) globalThis.__cfHyperdriveUrl = env.HYPERDRIVE.connectionString;
};

export default {
  fetch(request, env, ctx) {
    useHyperdrive(env);
    return openNextWorker.fetch(request, env, ctx);
  },
  async scheduled(controller, env, ctx) {
    useHyperdrive(env);
    const path = CRON_ROUTES[controller.cron];
    if (!path) return;
    const request = new Request(`https://www.lankanewhomes.com${path}`, {
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    });
    ctx.waitUntil(openNextWorker.fetch(request, env, ctx).then((res) => console.log(`cron ${path} -> ${res.status}`)));
  },
};


// Cloudflare Worker entry: the OpenNext Next.js worker plus Cron Triggers.
// Replaces Vercel Cron (vercel.json). Each trigger calls the existing /api/cron/* route with the same
// `Authorization: Bearer $CRON_SECRET` header those routes already check.
import openNextWorker from "../.open-next/worker.js";

const CRON_ROUTES = {
  "0 8 * * 1": "/api/cron/analytics-digest", // Mondays 08:00 UTC
  "0 2 * * *": "/api/cron/subscription-expiry", // daily 02:00 UTC
};

export default {
  fetch: openNextWorker.fetch,
  async scheduled(controller, env, ctx) {
    const path = CRON_ROUTES[controller.cron];
    if (!path) return;
    const request = new Request(`https://www.lankanewhomes.com${path}`, {
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    });
    ctx.waitUntil(openNextWorker.fetch(request, env, ctx).then((res) => console.log(`cron ${path} -> ${res.status}`)));
  },
};


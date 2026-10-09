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


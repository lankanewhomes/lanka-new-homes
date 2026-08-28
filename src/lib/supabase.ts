import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  return client;
}

// Server-only client using the service_role key — never import this from a
// client component. All reads/writes happen through store files and API
// routes, which run on the server.
//
// Created lazily (on first property access) instead of at module import
// time: Next.js's build-time "collect page data" step imports every route
// module just to inspect its static config, without ever invoking it — so
// a top-level createClient() call turned a missing env var at build time
// into a hard build failure, even for routes that would only ever need
// real credentials at request time. This proxy defers that check until the
// client is actually used.
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const real = getClient();
    const value = Reflect.get(real, prop);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

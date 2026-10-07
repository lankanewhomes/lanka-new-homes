// Prints which environment variables the build can see (names only, never values) and stops early if the essentials are
// missing. Used by `npm run cf:build` (Cloudflare Workers Builds).
const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URI", "PAYLOAD_SECRET",
  "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM", "R2_PUBLIC_URL", "NEXT_PUBLIC_SITE_URL",
];
const present = REQUIRED.filter((name) => process.env[name]);
const missing = REQUIRED.filter((name) => !process.env[name]);
console.log(`Build env check: ${present.length}/${REQUIRED.length} required variables present.`);
if (present.length) console.log("Present:", present.join(", "));
if (missing.length) {
  console.log("MISSING:", missing.join(", "));
  console.log("Add them under Settings > Build > Build variables and secrets (not the runtime Variables and secrets list).");
  process.exit(1);
}

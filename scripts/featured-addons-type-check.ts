// Read-only: prints the check rules on featured_addons (which add-on types the table accepts). Changes nothing.
// Run with: npx tsx scripts/featured-addons-type-check.ts
import path from "node:path";
import { Client } from "pg";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const { rows } = await client.query("select conname, pg_get_constraintdef(oid) as def from pg_constraint where conrelid = 'public.featured_addons'::regclass and contype = 'c' order by conname");
    for (const row of rows) console.log(`${row.conname}: ${row.def}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });

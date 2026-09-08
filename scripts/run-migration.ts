// Applies one SQL file from supabase/migrations/ to the live Supabase
// Postgres database (same connection as run-schema.ts, which applies the
// whole docs/supabase-schema.sql instead).
//
// Run with: npx tsx scripts/run-migration.ts supabase/migrations/<file>.sql
//
// Migrations are written to be idempotent (if not exists / drop policy if
// exists), so re-running one is safe. Remember to mirror the change in
// docs/supabase-schema.sql — that file stays the source of truth.

import { promises as fs } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });

const file = process.argv[2];
if (!file) {
  throw new Error("Usage: npx tsx scripts/run-migration.ts supabase/migrations/<file>.sql");
}

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  throw new Error("Missing SUPABASE_DB_URL in .env.local");
}

async function main() {
  const sql = await fs.readFile(path.resolve(process.cwd(), file), "utf8");
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log(`Connected. Applying ${file}...`);
  try {
    await client.query(sql);
    console.log("Migration applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

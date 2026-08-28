// One-time: applies docs/supabase-schema.sql directly to the Supabase Postgres database.
// Run with: npx tsx scripts/run-schema.ts

import { promises as fs } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error("Missing SUPABASE_DB_URL in .env.local");
}

async function main() {
  const sql = await fs.readFile(path.join(process.cwd(), "docs/supabase-schema.sql"), "utf8");

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected. Applying schema...");

  try {
    await client.query(sql);
    console.log("Schema applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Schema apply failed:", error.message);
  process.exit(1);
});

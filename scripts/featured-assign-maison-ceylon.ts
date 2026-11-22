// Gives Maison Ceylon a free Elite package (first Premium, then owner 2026-11-22: "make it elite") as a live test of the Featured placements (owner, 2026-11-21: "i want to test it how
// it performs. they dont need to pay now... do the premium"). One row in featured_packages; safe to re-run (same id, upsert).
// Change the projects or the end date later in /dashboard/featured, or edit the values here and run it again:
//   npx tsx scripts/featured-assign-maison-ceylon.ts
import path from "node:path";
import { config } from "dotenv";
import { Client } from "pg";

config({ path: path.join(process.cwd(), ".env.local") });

const PACKAGE = {
  id: "pkg-maison-ceylon-test-2026-11",
  developerSlug: "maison-ceylon",
  tier: "elite",
  startDate: "2026-11-21",
  endDate: "2026-12-21", // 30-day test
  slots: 6, // Elite = 6 project slots; they have 4 projects, so all four are in
  projectSlugs: ["villa-sahana", "villa-samagi", "bungalow-ithiri", "villa-senehasa"],
  note: "Free live test, not paid (owner, 2026-11-21)",
};

async function main() {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const found = await client.query("select slug from projects where developer_slug = $1 and slug = any($2)", [PACKAGE.developerSlug, PACKAGE.projectSlugs]);
    const missing = PACKAGE.projectSlugs.filter((slug) => !found.rows.some((row) => row.slug === slug));
    if (missing.length) throw new Error(`Not Maison Ceylon projects: ${missing.join(", ")}`);
    await client.query(
      `insert into featured_packages (id, developer_slug, tier, start_date, end_date, slots, project_slugs, founding_partner, note)
       values ($1, $2, $3, $4, $5, $6, $7, false, $8)
       on conflict (id) do update set tier = excluded.tier, start_date = excluded.start_date, end_date = excluded.end_date,
         slots = excluded.slots, project_slugs = excluded.project_slugs, note = excluded.note`,
      [PACKAGE.id, PACKAGE.developerSlug, PACKAGE.tier, PACKAGE.startDate, PACKAGE.endDate, PACKAGE.slots, PACKAGE.projectSlugs, PACKAGE.note],
    );
    const rows = await client.query("select id, developer_slug, tier, start_date::text, end_date::text, slots, project_slugs from featured_packages");
    console.log(rows.rows);
  } finally {
    await client.end();
  }
}

main().catch((error) => { console.error(error.message); process.exit(1); });

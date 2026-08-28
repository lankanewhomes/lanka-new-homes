// One-time migration: pushes existing local JSON/SQLite data into Supabase.
// Run with: npx tsx scripts/migrate-to-supabase.ts
// Safe to re-run — every insert is an upsert on the primary key.

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import Database from "better-sqlite3";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });

import { projects as staticProjects } from "../src/data/projects";
import { developers as staticDevelopers } from "../src/data/developers";
import { constructionCompanies } from "../src/data/construction-companies";
import type { Project, Developer, Neighborhood, HeroAd } from "../src/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

const dataDir = path.join(process.cwd(), "data");

async function readJson<T>(fileName: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(dataDir, fileName), "utf8");
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return fallback;
  }
}

async function migrateProjects() {
  const overrides = await readJson<Partial<Project>[]>("custom-projects.json", []);
  const bySlug = new Map<string, Project>();
  for (const project of staticProjects) bySlug.set(project.slug, project);
  for (const override of overrides) {
    if (!override.slug) continue;
    bySlug.set(override.slug, { ...(bySlug.get(override.slug) ?? {}), ...override } as Project);
  }

  const rows = Array.from(bySlug.values()).map((project) => ({
    slug: project.slug,
    name: project.name,
    developer_slug: project.developerSlug,
    developer_name: project.developerName,
    status: project.status,
    type: project.type,
    starting_price_lkr: project.startingPriceLkr,
    location: project.location,
    city: project.city,
    district: project.district,
    province: project.province,
    neighborhood: project.neighborhood,
    is_featured: Boolean(project.isFeatured),
    is_move_in_now: Boolean(project.isMoveInNow),
    data: project,
  }));

  if (rows.length === 0) return 0;
  const { error } = await supabase.from("projects").upsert(rows, { onConflict: "slug" });
  if (error) throw new Error(`projects: ${error.message}`);
  return rows.length;
}

async function migrateDevelopers() {
  const overrides = await readJson<Developer[]>("custom-developers.json", []);
  const bySlug = new Map<string, Developer>();
  for (const developer of staticDevelopers) bySlug.set(developer.slug, developer);
  for (const developer of overrides) bySlug.set(developer.slug, developer);

  const rows = Array.from(bySlug.values()).map((developer) => ({
    slug: developer.slug,
    name: developer.name,
    location: developer.location,
    data: developer,
  }));

  if (rows.length === 0) return 0;
  const { error } = await supabase.from("developers").upsert(rows, { onConflict: "slug" });
  if (error) throw new Error(`developers: ${error.message}`);
  return rows.length;
}

async function migrateNeighborhoods() {
  const neighborhoods = await readJson<Neighborhood[]>("neighborhoods.json", []);
  const rows = neighborhoods.map((neighborhood) => ({
    slug: neighborhood.slug,
    name: neighborhood.name,
    city: neighborhood.city,
    province: neighborhood.province,
    data: neighborhood,
  }));

  if (rows.length === 0) return 0;
  const { error } = await supabase.from("neighborhoods").upsert(rows, { onConflict: "slug" });
  if (error) throw new Error(`neighborhoods: ${error.message}`);
  return rows.length;
}

async function migrateHeroAds() {
  const ads = await readJson<HeroAd[]>("hero-ads.json", []);
  const rows = ads.map((ad) => ({
    id: ad.id,
    developer_slug: ad.developerSlug,
    project_slug: ad.projectSlug ?? null,
    status: ad.status,
    order: ad.order,
    data: ad,
  }));

  if (rows.length === 0) return 0;
  const { error } = await supabase.from("hero_ads").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`hero_ads: ${error.message}`);
  return rows.length;
}

async function migrateConstructionCompanies() {
  const rows = constructionCompanies.map((company) => ({
    slug: company.slug,
    name: company.name,
    location: company.location,
    data: company,
  }));

  if (rows.length === 0) return 0;
  const { error } = await supabase.from("construction_companies").upsert(rows, { onConflict: "slug" });
  if (error) throw new Error(`construction_companies: ${error.message}`);
  return rows.length;
}

async function migrateTracking() {
  const dbPath = path.join(dataDir, "tracking.sqlite");
  try {
    await fs.access(dbPath);
  } catch {
    return { leads: 0, views: 0 };
  }

  const db = new Database(dbPath, { readonly: true });

  const leadRows = db.prepare("SELECT * FROM leads").all() as Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    preferred_contact_method: string;
    message: string;
    project_slug: string;
    developer_slug: string;
    created_at: string;
  }>;

  if (leadRows.length > 0) {
    const { error } = await supabase.from("leads").upsert(leadRows, { onConflict: "id" });
    if (error) throw new Error(`leads: ${error.message}`);
  }

  const viewRows = db.prepare("SELECT project_slug, developer_slug, session_id, viewed_at FROM project_views").all() as Array<{
    project_slug: string;
    developer_slug: string;
    session_id: string;
    viewed_at: string;
  }>;

  if (viewRows.length > 0) {
    const { error } = await supabase.from("project_views").insert(viewRows);
    if (error) throw new Error(`project_views: ${error.message}`);
  }

  db.close();
  return { leads: leadRows.length, views: viewRows.length };
}

async function main() {
  console.log("Migrating to Supabase...\n");

  const projectCount = await migrateProjects();
  console.log(`✓ projects: ${projectCount}`);

  const developerCount = await migrateDevelopers();
  console.log(`✓ developers: ${developerCount}`);

  const neighborhoodCount = await migrateNeighborhoods();
  console.log(`✓ neighborhoods: ${neighborhoodCount}`);

  const heroAdCount = await migrateHeroAds();
  console.log(`✓ hero_ads: ${heroAdCount}`);

  const companyCount = await migrateConstructionCompanies();
  console.log(`✓ construction_companies: ${companyCount}`);

  const tracking = await migrateTracking();
  console.log(`✓ leads: ${tracking.leads}`);
  console.log(`✓ project_views: ${tracking.views}`);

  console.log("\nDone.");
}

main().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});

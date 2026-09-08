import path from "node:path";
import { config as loadEnv } from "dotenv";
loadEnv({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  const { getPayload } = await import("payload");
  const config = (await import("../payload.config")).default;
  const payload = await getPayload({ config });

  const { docs: leads } = await payload.find({ collection: "leads", limit: 1000, depth: 0, overrideAccess: true });
  console.log(`Found ${leads.length} lead(s) referencing projects — deleting first (FK constraint).`);
  for (const lead of leads) {
    await payload.delete({ collection: "leads", id: lead.id, overrideAccess: true });
  }

  const { docs: analytics } = await payload.find({ collection: "analytics", limit: 5000, depth: 0, overrideAccess: true });
  console.log(`Found ${analytics.length} analytics event(s) referencing projects — deleting first (FK constraint).`);
  for (const event of analytics) {
    await payload.delete({ collection: "analytics", id: event.id, overrideAccess: true });
  }

  const { docs: heroSlides } = await payload.find({ collection: "hero-slides", limit: 1000, depth: 0, overrideAccess: true });
  console.log(`Found ${heroSlides.length} hero slide(s) referencing projects — deleting first (FK constraint).`);
  for (const slide of heroSlides) {
    await payload.delete({ collection: "hero-slides", id: slide.id, overrideAccess: true });
  }

  const { docs } = await payload.find({ collection: "projects", limit: 1000, depth: 0, overrideAccess: true });
  console.log(`Found ${docs.length} project(s) in Payload.`);
  for (const doc of docs) {
    await payload.delete({ collection: "projects", id: doc.id, overrideAccess: true });
    console.log("Deleted from Payload:", doc.slug);
  }

  const { supabaseAdmin } = await import("../src/lib/supabase");
  const { data: rows, error: selectError } = await supabaseAdmin.from("projects").select("slug");
  if (selectError) throw new Error(selectError.message);
  console.log(`Found ${rows?.length ?? 0} project row(s) in Supabase.`);

  const { error: deleteError, count } = await supabaseAdmin.from("projects").delete({ count: "exact" }).not("slug", "is", null);
  if (deleteError) throw new Error(deleteError.message);
  console.log("Deleted from Supabase, rows removed:", count);

  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });

import { NextResponse } from "next/server";
import { loadBayOneStatuses } from "@/lib/bay-one-availability";

// Keeps Bay One's "Units sold" / "Units available" (and so the listing's stats chips) in step with the developer's own explorer.
// Triggered by a Cloudflare Cron Trigger (cloudflare/worker.js), same auth as the other crons: `Authorization: Bearer $CRON_SECRET`.
// Only writes when a number actually changed, and never writes if the developer's page could not be read.
const SLUG = "bay-one-residences-colombo";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let statuses: Record<string, "sold" | "available">;
  try {
    statuses = (await loadBayOneStatuses(true)).statuses;
  } catch (error) {
    return NextResponse.json({ updated: false, reason: error instanceof Error ? error.message : "source unavailable" }, { status: 502 });
  }
  const values = Object.values(statuses);
  const soldUnits = values.filter((status) => status === "sold").length;
  const availableUnits = values.length - soldUnits;

  const { getPayload } = await import("payload");
  const payloadConfig = (await import("../../../../../../payload.config")).default;
  const payload = await getPayload({ config: payloadConfig });
  const found = await payload.find({ collection: "projects", where: { slug: { equals: SLUG } }, limit: 1, depth: 0 });
  const project = found.docs[0] as { id: number; soldUnits?: number | null; availableUnits?: number | null } | undefined;
  if (!project) return NextResponse.json({ updated: false, reason: "project not found" }, { status: 404 });
  if (project.soldUnits === soldUnits && project.availableUnits === availableUnits) {
    return NextResponse.json({ updated: false, soldUnits, availableUnits });
  }
  await payload.update({ collection: "projects", id: project.id, data: { soldUnits, availableUnits }, depth: 0 });
  return NextResponse.json({ updated: true, soldUnits, availableUnits });
}

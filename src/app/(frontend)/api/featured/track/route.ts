import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { FEATURED_DEMO } from "@/lib/featured/demo";

// Records one Featured impression / click / lead for the monthly developer report. Best effort: it never fails the page.
// Writes nothing while the demo is on (and quietly does nothing until the featured_events table exists).
export async function POST(request: Request) {
  if (FEATURED_DEMO) return NextResponse.json({ ok: true, demo: true });
  try {
    const body = (await request.json()) as { event?: string; placement?: string; projectSlug?: string; developer?: string; path?: string };
    if (!["impression", "click", "lead"].includes(body.event ?? "") || !body.placement) return NextResponse.json({ ok: false }, { status: 400 });
    await supabaseAdmin.from("featured_events").insert({
      event: body.event,
      placement: String(body.placement).slice(0, 60),
      project_slug: body.projectSlug ? String(body.projectSlug).slice(0, 120) : null,
      developer_slug: body.developer ? String(body.developer).slice(0, 120) : null,
      path: body.path ? String(body.path).slice(0, 200) : null,
    });
  } catch {
    // ignore
  }
  return NextResponse.json({ ok: true });
}

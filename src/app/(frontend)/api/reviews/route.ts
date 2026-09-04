import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { Review } from "@/types";

type ReviewRow = { id: string; data: Review };

export async function GET(req: Request) {
  const developerSlug = new URL(req.url).searchParams.get("developerSlug");
  if (!developerSlug) {
    return NextResponse.json({ error: "Missing developerSlug" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("id, data")
    .eq("developer_slug", developerSlug)
    .eq("status", "approved");
  if (error) {
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }

  const reviews = ((data ?? []) as ReviewRow[])
    .map((row) => row.data)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ reviews });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const required = ["developerSlug", "rating", "comment", "reviewerName", "reviewerEmail"] as const;
    for (const field of required) {
      if (!body?.[field]) {
        return NextResponse.json({ error: `Missing ${field}` }, { status: 400 });
      }
    }

    const rating = Number(body.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const { getPayload } = await import("payload");
    const payloadConfig = (await import("../../../../../payload.config")).default;
    const payload = await getPayload({ config: payloadConfig });

    const developerRes = await payload.find({
      collection: "developers",
      where: { slug: { equals: body.developerSlug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const developerDoc = developerRes.docs[0];
    if (!developerDoc) {
      return NextResponse.json({ error: "Developer not found" }, { status: 404 });
    }

    let projectId: string | number | undefined;
    if (typeof body.projectSlug === "string" && body.projectSlug) {
      const projectRes = await payload.find({
        collection: "projects",
        where: { slug: { equals: body.projectSlug } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });
      projectId = projectRes.docs[0]?.id;
    }

    await payload.create({
      collection: "reviews",
      data: {
        developer: developerDoc.id,
        project: projectId,
        rating,
        comment: String(body.comment),
        reviewer_name: String(body.reviewerName),
        reviewer_email: String(body.reviewerEmail),
      } as never,
      overrideAccess: true,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }
}

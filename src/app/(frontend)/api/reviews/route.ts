import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { PROFILE_ENTITY_COLLECTION, isProfileEntityType } from "@/lib/profile-entities";
import type { ProfileEntityType, Review } from "@/types";

type ReviewRow = { id: string; data: Review };

// Reviews for any profile page (developer or partner directory). Callers
// pass `entityType` + `entitySlug`; the older `developerSlug` shape is still
// accepted and treated as a developer review.
function resolveTarget(source: { entityType?: unknown; entitySlug?: unknown; developerSlug?: unknown }): { entityType: ProfileEntityType; entitySlug: string } | null {
  const entityType = isProfileEntityType(source.entityType) ? source.entityType : "developer";
  const entitySlug = typeof source.entitySlug === "string" && source.entitySlug ? source.entitySlug : typeof source.developerSlug === "string" ? source.developerSlug : "";
  return entitySlug ? { entityType, entitySlug } : null;
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const target = resolveTarget({ entityType: params.get("entityType"), entitySlug: params.get("entitySlug"), developerSlug: params.get("developerSlug") });
  if (!target) {
    return NextResponse.json({ error: "Missing entitySlug" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("id, data")
    .eq("entity_type", target.entityType)
    .eq("entity_slug", target.entitySlug)
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

    const target = resolveTarget(body ?? {});
    if (!target) {
      return NextResponse.json({ error: "Missing entitySlug" }, { status: 400 });
    }
    const required = ["rating", "comment", "reviewerName", "reviewerEmail"] as const;
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

    const collection = PROFILE_ENTITY_COLLECTION[target.entityType];
    const targetRes = await payload.find({
      collection: collection as "developers",
      where: { slug: { equals: target.entitySlug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const targetDoc = targetRes.docs[0];
    if (!targetDoc) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
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
        entity_type: target.entityType,
        developer: target.entityType === "developer" ? targetDoc.id : undefined,
        company: target.entityType === "developer" ? undefined : { relationTo: collection, value: targetDoc.id },
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

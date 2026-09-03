import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";

// Bridges the Supabase-authenticated developer dashboard to Payload's
// Payments collection, which has no Supabase equivalent — the only real
// way to create a payment is through Payload's own API. Developers never
// see or need a separate Payload login: this route authenticates them via
// their existing Supabase session, resolves their company/project by slug
// inside Payload, and creates the Payment on their behalf via Payload's
// Local API with overrideAccess (their Supabase role is the real gate —
// see getCurrentProfile() below — not Payload's own ownPayerAccess, which
// is what a developer using /payload-admin directly would otherwise need
// an admin-linked account for).
export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "developer" || !profile.developerSlug) {
    return NextResponse.json({ error: "Not signed in as a developer" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const paymentType = body?.paymentType;
  const featuredPage = body?.featuredPage;
  const projectSlug = body?.projectSlug;

  if (paymentType !== "featured_listing" && paymentType !== "featured_search") {
    return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
  }
  if (!featuredPage || typeof featuredPage !== "string") {
    return NextResponse.json({ error: "Missing featuredPage" }, { status: 400 });
  }
  if (!projectSlug || typeof projectSlug !== "string") {
    return NextResponse.json({ error: "Missing projectSlug" }, { status: 400 });
  }

  const { getPayload } = await import("payload");
  const payloadConfig = (await import("../../../../../../payload.config")).default;
  const payload = await getPayload({ config: payloadConfig });

  const developerRes = await payload.find({
    collection: "developers",
    where: { slug: { equals: profile.developerSlug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const developerDoc = developerRes.docs[0];
  if (!developerDoc) {
    return NextResponse.json({ error: "Developer profile not found" }, { status: 404 });
  }

  const projectRes = await payload.find({
    collection: "projects",
    where: { slug: { equals: projectSlug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const projectDoc = projectRes.docs[0];
  if (!projectDoc) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const projectDeveloperId = typeof projectDoc.developer === "object" && projectDoc.developer ? (projectDoc.developer as { id: unknown }).id : projectDoc.developer;
  if (String(projectDeveloperId) !== String(developerDoc.id)) {
    return NextResponse.json({ error: "That project doesn't belong to your company" }, { status: 403 });
  }

  const pricingRes = await payload.find({
    collection: "placement-pricing",
    where: {
      and: [
        { payment_type: { equals: paymentType } },
        { featured_page: { equals: featuredPage } },
        { active: { equals: true } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const pricing = pricingRes.docs[0];
  if (!pricing) {
    return NextResponse.json({ error: "No active price found for that placement — contact us." }, { status: 400 });
  }

  const payment = await payload.create({
    collection: "payments",
    data: {
      payer: { relationTo: "developers", value: developerDoc.id },
      related_project: projectDoc.id,
      payment_type: paymentType,
      featured_page: featuredPage,
      amount: pricing.price,
      currency: pricing.currency,
      status: "pending",
    } as never,
    overrideAccess: true,
  });

  return NextResponse.json({ ok: true, id: payment.id, amount: pricing.price, currency: pricing.currency });
}

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "developer" || !profile.developerSlug) {
    return NextResponse.json({ error: "Not signed in as a developer" }, { status: 401 });
  }

  const { getPayload } = await import("payload");
  const payloadConfig = (await import("../../../../../../payload.config")).default;
  const payload = await getPayload({ config: payloadConfig });

  const developerRes = await payload.find({
    collection: "developers",
    where: { slug: { equals: profile.developerSlug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const developerDoc = developerRes.docs[0];
  if (!developerDoc) {
    return NextResponse.json({ payments: [], pricing: [] });
  }

  const [paymentsRes, pricingRes] = await Promise.all([
    payload.find({
      collection: "payments",
      where: {
        and: [
          { "payer.relationTo": { equals: "developers" } },
          { "payer.value": { equals: developerDoc.id } },
        ],
      },
      sort: "-createdAt",
      depth: 1,
      overrideAccess: true,
    }),
    payload.find({
      collection: "placement-pricing",
      where: {
        and: [
          { payment_type: { in: ["featured_listing", "featured_search"] } },
          { active: { equals: true } },
        ],
      },
      limit: 100,
      depth: 0,
      overrideAccess: true,
    }),
  ]);

  return NextResponse.json({
    payments: paymentsRes.docs.map((doc) => ({
      id: doc.id,
      paymentType: doc.payment_type,
      featuredPage: doc.featured_page,
      amount: doc.amount,
      currency: doc.currency,
      status: doc.status,
      createdAt: doc.createdAt,
      project: typeof doc.related_project === "object" && doc.related_project ? (doc.related_project as { name?: string; slug?: string }) : null,
    })),
    pricing: pricingRes.docs.map((doc) => ({
      paymentType: doc.payment_type,
      featuredPage: doc.featured_page,
      tierName: doc.tier_name,
      price: doc.price,
      currency: doc.currency,
      durationDays: doc.duration_days,
    })),
  });
}

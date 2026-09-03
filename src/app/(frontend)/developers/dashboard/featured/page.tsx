import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";
import { FeaturedPlacementForm, type PlacementRequest, type PricingRow } from "@/components/dashboard/featured-placement-form";
import { getCurrentProfile } from "@/lib/auth";
import { getAllProjects } from "@/lib/project-store";

export const metadata: Metadata = {
  title: "Featured Placement",
  robots: { index: false, follow: false },
};

export default async function DeveloperFeaturedPlacementPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "developer" || !profile.developerSlug) {
    redirect("/developers/login");
  }

  const developerSlug = profile.developerSlug;
  const projects = (await getAllProjects())
    .filter((project) => project.developerSlug === developerSlug)
    .map((project) => ({ slug: project.slug, name: project.name }));

  const { getPayload } = await import("payload");
  const payloadConfig = (await import("../../../../../../payload.config")).default;
  const payload = await getPayload({ config: payloadConfig });

  const developerRes = await payload.find({
    collection: "developers",
    where: { slug: { equals: developerSlug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const developerDoc = developerRes.docs[0];

  const [paymentsRes, pricingRes] = await Promise.all([
    developerDoc
      ? payload.find({
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
        })
      : Promise.resolve({ docs: [] }),
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

  const initialRequests: PlacementRequest[] = paymentsRes.docs.map((doc) => ({
    id: String(doc.id),
    paymentType: doc.payment_type,
    featuredPage: doc.featured_page ?? null,
    amount: doc.amount,
    currency: doc.currency,
    status: doc.status,
    createdAt: doc.createdAt,
    project: doc.related_project && typeof doc.related_project === "object" ? (doc.related_project as { name?: string; slug?: string }) : null,
  }));

  const pricing: PricingRow[] = pricingRes.docs.map((doc) => ({
    paymentType: doc.payment_type,
    featuredPage: doc.featured_page ?? null,
    price: doc.price,
    currency: doc.currency,
    durationDays: doc.duration_days ?? null,
  }));

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar
        links={[
          { label: "Overview", href: "/developers/dashboard" },
          { label: "Homepage Hero", href: "/developers/dashboard/homepage-hero" },
          { label: "Featured Placement", href: "/developers/dashboard/featured" },
          { label: "Profile", href: `/developers/${developerSlug}` },
        ]}
      />
      <section className="space-y-4">
        <DashboardHeader title="Featured Placement" subtitle="Pay to get one of your projects featured on the homepage, search results, or a category page." />
        <FeaturedPlacementForm projects={projects} pricing={pricing} initialRequests={initialRequests} />
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getProjectBySlug } from "@/lib/project-store";
import { FeaturedSlot } from "@/components/featured/featured-slot";
import { FEATURED_ENABLED } from "@/lib/featured/demo";
import { notFound } from "next/navigation";

// The thank-you page after an enquiry or brochure download. Never indexed. The "You may also like" block is the paid Featured placement
// "thankyou-also-like": featured projects near the one the visitor just asked about.
export const metadata: Metadata = { title: "Thank you", robots: { index: false, follow: false } };

export default async function ThankYouPage({ searchParams }: { searchParams: Promise<{ project?: string; type?: string }> }) {
  if (!FEATURED_ENABLED) notFound();
  const { project: slug, type } = await searchParams;
  const project = slug ? await getProjectBySlug(slug) : undefined;
  const brochure = type === "brochure";
  return (
    <div className="mx-auto w-full max-w-290 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold">{brochure ? "Your brochure is on its way" : "Thank you, your enquiry was sent"}</h1>
      <p className="mt-3 max-w-xl text-stone-700">
        {project ? `The ${project.name} sales team will get back to you shortly.` : "The developer will get back to you shortly."} You can keep browsing while you wait.
      </p>
      <p className="mt-4 flex flex-wrap gap-3 text-sm">
        {project ? <Link className="underline" href={`/projects/${project.slug}`}>Back to {project.name}</Link> : null}
        <Link className="underline" href="/projects">Browse all new projects</Link>
      </p>
      {project ? (
        <FeaturedSlot
          placement="thankyou-also-like"
          context={{ location: project.city || project.location, type: project.type, projectSlug: project.slug, developerSlug: project.developerSlug, limit: 3 }}
          fallbackContexts={[{ location: project.district, projectSlug: project.slug, developerSlug: project.developerSlug, limit: 3 }, { type: project.type, projectSlug: project.slug, developerSlug: project.developerSlug, limit: 3 }]}
        />
      ) : (
        <FeaturedSlot placement="thankyou-also-like" context={{ limit: 3 }} />
      )}
    </div>
  );
}

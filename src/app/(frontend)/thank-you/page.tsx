import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { getAllProjects, getProjectBySlug } from "@/lib/project-store";
import { getLandBySlug, getSimilarLandCandidates } from "@/lib/land-store";
import { landToProjectShape } from "@/lib/land-to-project";
import { slimForHome } from "@/lib/home-slim";
import { ListingGridCard } from "@/components/marketplace/listing-page";
import { FeaturedSlot } from "@/components/featured/featured-slot";
import type { Project } from "@/types";
import "./thank-you.css";

// The thank-you page a buyer lands on after Request Info, Download Brochure, a land inquiry or a WhatsApp enquiry (owner, 2026-11-21).
// Never indexed. It shows: a confirmation, the brochure button again (brochure requests), the paid Featured block "thankyou-also-like"
// (renders nothing while Featured is switched off or nothing is booked), then more listings near the one they asked about.
export const metadata: Metadata = { title: "Thank you", robots: { index: false, follow: false } };

type Kind = "request" | "brochure" | "whatsapp" | "inquiry";
const KINDS: Kind[] = ["request", "brochure", "whatsapp", "inquiry"];
const same = (a?: string | null, b?: string | null) => Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());
const isSold = (project: Project) => /sold/i.test(String(project.status));

/** Up to 4 other projects: same city first, then the same district, then the same type. Sold-out ones are left out. */
async function similarProjects(project: Project | undefined): Promise<Project[]> {
  const all = (await getAllProjects()).filter((item) => item.slug !== project?.slug && !isSold(item));
  if (!project) return all.slice(0, 4);
  const picked: Project[] = [];
  const add = (items: Project[]) => { for (const item of items) if (picked.length < 4 && !picked.includes(item)) picked.push(item); };
  add(all.filter((item) => same(item.city, project.city)));
  add(all.filter((item) => same(item.district, project.district)));
  add(all.filter((item) => same(item.type, project.type)));
  add(all);
  return picked;
}

export default async function ThankYouPage({ searchParams }: { searchParams: Promise<{ project?: string; type?: string; kind?: string }> }) {
  const { project: slug, type, kind } = await searchParams;
  const requestKind: Kind = KINDS.includes(type as Kind) ? (type as Kind) : "request";
  const isLand = kind === "land";
  const land = slug && isLand ? await getLandBySlug(slug) : undefined;
  const project = slug && !isLand ? await getProjectBySlug(slug) : undefined;
  const listing = land ? landToProjectShape(land) : project;
  const basePath = land ? "/land" : "/projects";
  const more = land
    ? (await getSimilarLandCandidates({ slug: land.slug, district: land.district, city: land.city }, 8)).filter((item) => item.status !== "Sold").slice(0, 4).map(landToProjectShape)
    : await similarProjects(project);

  const title = requestKind === "brochure" ? "Your brochure is on its way" : requestKind === "whatsapp" ? "Thank you, your WhatsApp enquiry is ready" : "Thank you, your request was sent";
  const who = listing ? `The ${listing.name} sales team` : "The developer";
  const line =
    requestKind === "brochure"
      ? listing?.brochureUrl
        ? "Your download should have started. We have also emailed you a copy, and you can download it again below."
        : `${who} will send you the brochure and details shortly.`
      : requestKind === "whatsapp"
        ? `WhatsApp opened with your message ready to send. ${who} will reply to you there.`
        : `${who} will get back to you by email shortly.`;

  return (
    <div className="thank-you-page">
      <section className="thank-you-hero">
        <span className="thank-you-tick" aria-hidden="true"><Check strokeWidth={1.5} /></span>
        <h1>{title}</h1>
        <p>{line} You can keep browsing while you wait.</p>
        <div className="thank-you-actions">
          {requestKind === "brochure" && listing?.brochureUrl ? <a className="thank-you-button thank-you-button-primary" href={listing.brochureUrl} target="_blank" rel="noopener noreferrer">Download brochure</a> : null}
          {listing ? <Link className="thank-you-button" href={`${basePath}/${listing.slug}`}>Back to {listing.name}</Link> : null}
          <Link className="thank-you-button" href={land ? "/land" : "/projects"}>{land ? "Browse all land" : "Browse all new projects"}</Link>
        </div>
      </section>

      {land ? null : project ? (
        <FeaturedSlot
          placement="thankyou-also-like"
          context={{ location: project.city || project.location, type: project.type, projectSlug: project.slug, developerSlug: project.developerSlug, limit: 3 }}
          fallbackContexts={[{ location: project.district, projectSlug: project.slug, developerSlug: project.developerSlug, limit: 3 }, { type: project.type, projectSlug: project.slug, developerSlug: project.developerSlug, limit: 3 }]}
        />
      ) : (
        <FeaturedSlot placement="thankyou-also-like" context={{ limit: 3 }} />
      )}

      {more.length > 0 ? (
        <section className={`new-listings-section${land ? " land-listings-section" : ""}`} aria-label="More listings">
          <div className="featured-listings-head">
            <h2>{listing ? (land ? "More land nearby" : "More listings like this") : "New listings"}</h2>
            <p className="featured-listings-subhead">{listing ? `Other ${land ? "land" : "new developments"} buyers look at alongside ${listing.name}.` : "The latest developments on Lanka New Homes."}</p>
          </div>
          <div className="featured-listings-shell">
            <div className="home-card-grid featured-listings-grid">
              {more.map((item) => <ListingGridCard key={item.slug} project={land ? item : slimForHome(item)} basePath={basePath} />)}
            </div>
            <div className="featured-listings-footer new-listings-footer">
              <Link href={land ? "/land" : "/search"} className="featured-listings-button">
                {land ? "View all land listings" : "View all listings"}
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

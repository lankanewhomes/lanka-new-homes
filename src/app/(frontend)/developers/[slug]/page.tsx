import type { Metadata } from "next";
import { SeoAboutBlock } from "@/components/marketplace/seo-about-block";
import { notFound } from "next/navigation";
import { DeveloperProfileView } from "@/components/marketplace/developer-profile-view";
import { getAllDevelopers, getDeveloperBySlug } from "@/lib/developer-store";
import { landToProjectShape } from "@/lib/land-to-project";
import { getAllLands } from "@/lib/land-store";
import { getAllProjects } from "@/lib/project-store";
import { getApprovedReviewsByDeveloperSlug } from "@/lib/review-store";
import { toAbsoluteUrl, withSocial } from "@/lib/seo";

// Regenerate at most once a minute so admin edits (e.g. status changes)
// show up without waiting for the next deploy.
export const revalidate = 60;

type DeveloperProfilePageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const developers = await getAllDevelopers();
  return developers.map((developer) => ({ slug: developer.slug }));
}

export async function generateMetadata({ params }: DeveloperProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const developer = await getDeveloperBySlug(slug);

  if (!developer || developer.hiddenFromSite) {
    return {
      title: "Developer Not Found",
      robots: { index: false, follow: false },
    };
  }

  // SEO title / description set in the CMS (SEO tab) win; otherwise the generic profile wording.
  // Default (owner, 2026-11-02): people search developer names (Search Console: "sanken construction", "crystal property group",
  // "john keells properties" were shown hundreds of times), so the title is the name plus what they want to find, and the description
  // carries the real project count.
  const [projectsOfDeveloper, landsOfDeveloper] = await Promise.all([getAllProjects(), getAllLands()]);
  const projectCount = projectsOfDeveloper.filter((project) => project.developerSlug === developer.slug).length;
  const landCount = landsOfDeveloper.filter((land) => land.sellerSlug === developer.slug).length;
  const intro = developer.description.replace(/\s+/g, " ").trim();
  const found = [projectCount > 0 ? `${projectCount} ${projectCount === 1 ? "project" : "projects"}` : "", landCount > 0 ? `${landCount} land ${landCount === 1 ? "listing" : "listings"}` : ""].filter(Boolean).join(" and ");
  const countLead = found ? `${found} by ${developer.name} in Sri Lanka: prices, floor plans and contact. ` : `${developer.name}, a Sri Lanka developer: profile, projects and contact. `;
  const title = developer.seoTitle?.trim() || `${developer.name}: Projects, Prices & Contact`;
  const description = developer.seoDescription?.trim() || `${countLead}${intro.length > Math.max(0, 160 - countLead.length) ? `${intro.slice(0, Math.max(40, 157 - countLead.length)).replace(/\s+\S*$/, "")}…` : intro}`;
  const canonicalPath = `/developers/${developer.slug}`;

  return withSocial({
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: "profile",
      images: [
        {
          url: developer.logo,
          alt: developer.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [developer.logo],
    },
  });
}

export default async function DeveloperProfilePage({ params }: DeveloperProfilePageProps) {
  const { slug } = await params;
  const developer = await getDeveloperBySlug(slug);
  if (!developer || developer.hiddenFromSite) return notFound();

  const allProjects = await getAllProjects();
  const allLands = await getAllLands();
  // A developer's raw land parcels (e.g. Bonavista Phase 2) belong on their
  // profile alongside their built projects — reshaped via landToProjectShape
  // (same adapter the /land detail page uses) and marked isLand so
  // ProfileView links to /land/<slug> instead of /projects/<slug>.
  const developerLands = allLands
    .filter((land) => land.sellerType === "developer" && land.sellerSlug === slug)
    .map(landToProjectShape);
  const developerProjects = [...allProjects.filter((p) => p.developerSlug === slug), ...developerLands];
  const reviews = await getApprovedReviewsByDeveloperSlug(slug);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: developer.name,
    description: developer.description,
    url: toAbsoluteUrl(`/developers/${developer.slug}`),
    logo: developer.logo,
    foundingDate: String(developer.establishedYear),
    location: {
      "@type": "Place",
      name: developer.location,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: developer.phone,
      email: developer.email,
      contactType: "sales",
      areaServed: "LK",
    },
    sameAs: [developer.website],
  };

  return (
    <div className="developer-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <DeveloperProfileView developer={developer} projects={developerProjects} reviews={reviews} />
      <SeoAboutBlock
        title={`About ${developer.name} on LankaNewHomes`}
        paragraphs={[
          `${developer.name} is a property developer${developer.location ? ` based in ${developer.location}` : ""} with ${developerProjects.length} listing${developerProjects.length === 1 ? "" : "s"} on LankaNewHomes. This page shows who they are and every project or land parcel they have listed with us.`,
          "Open a listing to see its photos, floor plans, pricing from the developer and location on the map. Checking a developer's earlier and current work is one of the most useful steps before you reserve a home or buy a plot.",
          `You can send an enquiry directly to ${developer.name}'s team from this page or from any of their listings. There is no agent in between, and listing on LankaNewHomes is free for developers.`,
        ]}
      />
    </div>
  );
}

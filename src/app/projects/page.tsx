import type { Metadata } from "next";
import { projects } from "@/data/projects";
import { FilterBar, MapPlaceholder, ProjectListItem, ResultsToolbar } from "@/components/marketplace/components";

export const metadata: Metadata = {
  title: "New Apartment Projects in Sri Lanka",
  description: "Browse newly launched apartment and condominium projects across Sri Lanka, with pricing, locations, and developer details.",
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    title: "New Apartment Projects in Sri Lanka",
    description: "Browse newly launched apartment and condominium projects across Sri Lanka, with pricing, locations, and developer details.",
    url: "/projects",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "New Apartment Projects in Sri Lanka",
    description: "Browse newly launched apartment and condominium projects across Sri Lanka, with pricing, locations, and developer details.",
  },
};

export default function ProjectsPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold">New Apartment Projects</h1>
        <ResultsToolbar count={projects.length} />
        <FilterBar />
        <div className="grid gap-3">
          {projects.map((project) => (
            <ProjectListItem key={project.slug} project={project} />
          ))}
        </div>
      </section>
      <aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]">
        <MapPlaceholder />
      </aside>
    </div>
  );
}

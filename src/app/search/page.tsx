import type { Metadata } from "next";
import { projects } from "@/data/projects";
import { FilterBar, MapPlaceholder, ProjectListItem, ResultsToolbar, SearchBar } from "@/components/marketplace/components";

export const metadata: Metadata = {
  title: "Search New Developments in Sri Lanka",
  description: "Search new apartment and housing developments across Sri Lanka by location, price, and availability.",
  alternates: {
    canonical: "/search",
  },
  openGraph: {
    title: "Search New Developments in Sri Lanka",
    description: "Search new apartment and housing developments across Sri Lanka by location, price, and availability.",
    url: "/search",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Search New Developments in Sri Lanka",
    description: "Search new apartment and housing developments across Sri Lanka by location, price, and availability.",
  },
};

export default function SearchPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Search New Developments</h1>
      <SearchBar />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="space-y-4">
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
    </div>
  );
}

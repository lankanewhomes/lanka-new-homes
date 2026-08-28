import type { Metadata } from "next";
import { DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";
import { HeroAdsAdminPanel } from "@/components/dashboard/hero-ads-manager";
import { getAllDevelopers } from "@/lib/developer-store";
import { getAllProjects } from "@/lib/project-store";

export const metadata: Metadata = {
  title: "Homepage Hero Banner",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminHeroAdsPage() {
  const developers = await getAllDevelopers();
  const allProjects = await getAllProjects();
  const developerOptions = developers.map((developer) => ({
    slug: developer.slug,
    name: developer.name,
    projects: allProjects.filter((project) => project.developerSlug === developer.slug).map((project) => ({ slug: project.slug, name: project.name })),
  }));

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar links={[{ label: "Overview", href: "/admin" }, { label: "Projects", href: "/admin" }, { label: "Developers", href: "/admin/developers" }, { label: "Neighborhoods", href: "/admin/neighborhoods" }, { label: "Homepage Hero", href: "/admin/hero-ads" }, { label: "Users", href: "/admin" }, { label: "Leads", href: "/admin" }, { label: "Articles", href: "/admin" }, { label: "Locations", href: "/admin" }, { label: "Settings", href: "/admin" }]} />
      <section className="space-y-4">
        <DashboardHeader title="Homepage Hero Banner" subtitle="Add a hero image on behalf of a builder, then approve, reorder, or unpublish it." />
        <HeroAdsAdminPanel developers={developerOptions} />
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";
import { HeroAdRequestForm } from "@/components/dashboard/hero-ad-request-form";
import { getCurrentProfile } from "@/lib/auth";
import { getDeveloperBySlug } from "@/lib/developer-store";
import { getAllProjects } from "@/lib/project-store";

export const metadata: Metadata = {
  title: "Homepage Hero Placement",
  robots: { index: false, follow: false },
};

export default async function DeveloperHomepageHeroPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "developer" || !profile.developerSlug) {
    redirect("/developers/login");
  }

  const developer = await getDeveloperBySlug(profile.developerSlug);
  const projects = (await getAllProjects())
    .filter((project) => project.developerSlug === profile.developerSlug)
    .map((project) => ({ slug: project.slug, name: project.name }));

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar links={[{ label: "Overview", href: "/developers/dashboard" }, { label: "Homepage Hero", href: "/developers/dashboard/homepage-hero" }, { label: "Profile", href: `/developers/${profile.developerSlug}` }]} />
      <section className="space-y-4">
        <DashboardHeader title="Homepage Hero Banner" subtitle="Submit a paid homepage hero placement for one of your projects. It will be reviewed before going live." />
        <HeroAdRequestForm developers={[{ slug: profile.developerSlug, name: developer?.name ?? profile.developerSlug, projects }]} />
      </section>
    </div>
  );
}

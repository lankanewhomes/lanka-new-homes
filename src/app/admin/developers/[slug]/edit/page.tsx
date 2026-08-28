import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BuilderProfileForm, DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";
import { getDeveloperBySlug } from "@/lib/developer-store";

export const metadata: Metadata = {
  title: "Edit Developer",
  robots: {
    index: false,
    follow: false,
  },
};

type EditDeveloperPageProps = { params: Promise<{ slug: string }> };

export default async function EditDeveloperPage({ params }: EditDeveloperPageProps) {
  const { slug } = await params;
  const developer = await getDeveloperBySlug(slug);
  if (!developer) return notFound();

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar links={[{ label: "Overview", href: "/admin" }, { label: "Projects", href: "/admin" }, { label: "Developers", href: "/admin/developers" }, { label: "Neighborhoods", href: "/admin/neighborhoods" }, { label: "Homepage Hero", href: "/admin/hero-ads" }, { label: "Users", href: "/admin" }, { label: "Leads", href: "/admin" }, { label: "Articles", href: "/admin" }, { label: "Locations", href: "/admin" }, { label: "Settings", href: "/admin" }]} />
      <section className="space-y-4">
        <DashboardHeader title={`Edit ${developer.name}`} subtitle="Update this developer's public profile, including their website URL." />
        <BuilderProfileForm initialDeveloper={developer} />
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { DashboardHeader, DashboardSidebar, NeighborhoodForm } from "@/components/dashboard/components";

export const metadata: Metadata = {
  title: "Add Neighborhood",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NewNeighborhoodPage() {
  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar links={[{ label: "Overview", href: "/admin" }, { label: "Developers", href: "/admin/developers" }, { label: "Neighborhoods", href: "/admin/neighborhoods" }, { label: "Homepage Hero", href: "/admin/hero-ads" }, { label: "Users", href: "/admin" }, { label: "Leads", href: "/admin" }, { label: "Articles", href: "/admin" }, { label: "Locations", href: "/admin" }, { label: "Settings", href: "/admin" }]} />
      <section className="space-y-4">
        <DashboardHeader title="Add Neighborhood" subtitle="Create a neighborhood page. Set a project's neighborhood name to match to link it here." />
        <NeighborhoodForm />
      </section>
    </div>
  );
}

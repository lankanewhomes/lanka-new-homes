import type { Metadata } from "next";
import { BuilderProfileForm, DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";

export const metadata: Metadata = {
  title: "Add Developer",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NewDeveloperPage() {
  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar />
      <section className="space-y-4">
        <DashboardHeader title="Add Developer" subtitle="Create a new developer record. This automatically publishes a public builder page." />
        <BuilderProfileForm />
      </section>
    </div>
  );
}

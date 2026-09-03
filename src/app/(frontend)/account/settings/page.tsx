import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { DashboardHeader, DashboardSidebar, ACCOUNT_NAV_LINKS } from "@/components/dashboard/components";
import { SettingsForm } from "@/components/account/settings-form";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar links={ACCOUNT_NAV_LINKS} />
      <section className="space-y-4">
        <DashboardHeader title="Settings" subtitle="Notifications, password, and privacy." />
        <SettingsForm profile={profile} />
      </section>
    </div>
  );
}

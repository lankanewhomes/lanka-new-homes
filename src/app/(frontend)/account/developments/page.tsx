import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSavedProfiles } from "@/lib/saved-profiles";
import { DashboardHeader, DashboardSidebar, ACCOUNT_NAV_LINKS } from "@/components/dashboard/components";
import { SavedDevelopmentsList } from "@/components/account/saved-developments-list";

export const metadata: Metadata = {
  title: "Saved Developments",
  robots: { index: false, follow: false },
};

export default async function SavedDevelopmentsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createSupabaseServerClient();
  const items = await getSavedProfiles(supabase, profile.id);

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar links={ACCOUNT_NAV_LINKS} />
      <section>
        <DashboardHeader title="Saved developments" subtitle="Developers and companies you're following — see their new units and price changes here." />
        <SavedDevelopmentsList userId={profile.id} initialItems={items} />
      </section>
    </div>
  );
}

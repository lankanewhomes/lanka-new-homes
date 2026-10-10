import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSavedProfiles } from "@/lib/saved-profiles";
import { AccountShell, AccountPageHero } from "@/components/account/account-shell";
import { SavedDevelopmentsList } from "@/components/account/saved-developments-list";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "Saved Developments",
  robots: { index: false, follow: false },
}, { path: "/account/developments" });

export default async function SavedDevelopmentsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createSupabaseServerClient();
  const items = await getSavedProfiles(supabase, profile.id);

  return (
    <AccountShell active="/account/developments">
      <AccountPageHero
        title="Saved developments."
        intro="Developers and companies you are following. See their new units and price changes here."
        stat={{ label: "Following", value: items.length }}
        cta={{ label: "Browse developers", href: "/developers" }}
      />
      <section className="fdv-box fdv-box--sage" id="following" aria-label="Saved developments">
        <SavedDevelopmentsList userId={profile.id} initialItems={items} />
      </section>
    </AccountShell>
  );
}

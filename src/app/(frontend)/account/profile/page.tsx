import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { AccountShell, AccountPageHero } from "@/components/account/account-shell";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <AccountShell active="/account/profile">
      <AccountPageHero
        title="Profile."
        intro="Your contact details and search preferences, used to tailor alerts."
      />
      <section className="fdv-box fdv-box--lilac" id="profile" aria-label="Profile">
        <ProfileForm profile={profile} />
      </section>
    </AccountShell>
  );
}

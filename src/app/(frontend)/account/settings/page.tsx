import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { AccountShell, AccountPageHero } from "@/components/account/account-shell";
import { SettingsForm } from "@/components/account/settings-form";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <AccountShell active="/account/settings">
      <AccountPageHero
        title="Settings."
        intro="Notifications, password and privacy."
      />
      <section className="fdv-box fdv-box--gray" id="settings" aria-label="Settings">
        <SettingsForm profile={profile} />
      </section>
    </AccountShell>
  );
}

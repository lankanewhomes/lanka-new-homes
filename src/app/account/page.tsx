import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (profile.role === "developer" && profile.developerSlug) {
    redirect("/developers/dashboard");
  }

  return (
    <div className="static-page-shell">
      <h1>My account</h1>
      <p className="static-page-lede">Signed in as {profile.email}.</p>
      <p style={{ marginTop: 24 }}>
        <Link href="/account/saved">View your saved listings →</Link>
      </p>
    </div>
  );
}

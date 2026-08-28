import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BuilderProfileForm } from "@/components/dashboard/components";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentProfile } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Developer Registration",
  description: "Register your development company on LankaLiving and publish your project listings.",
  alternates: { canonical: "/developers/register" },
};

export default async function DeveloperRegisterPage() {
  const profile = await getCurrentProfile();

  if (profile?.developerSlug) {
    redirect("/developers/dashboard");
  }

  if (!profile) {
    return (
      <div className="static-page-shell">
        <h1>Register as a developer</h1>
        <p className="static-page-lede">
          Create your developer account first, then set up your company profile. This automatically publishes a public
          page at /developers and lets you list projects.
        </p>
        <AuthForm mode="signup" intent="developer" redirectTo="/developers/register" />
        <p className="static-page-note">
          Already have a developer account? <a href="/developers/login">Log in</a> instead.
        </p>
      </div>
    );
  }

  return (
    <div className="static-page-shell">
      <h1>Set up your company profile</h1>
      <p className="static-page-lede">You&apos;re signed in as {profile.email}. Fill in your company details to finish registering.</p>
      <div className="mt-6">
        <BuilderProfileForm redirectTo="/developers/{slug}" />
      </div>
    </div>
  );
}

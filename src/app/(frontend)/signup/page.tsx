import type { Metadata } from "next";
import Link from "next/link";
import { PageAuthShell } from "@/components/auth/page-auth-shell";
import { AuthBoxes, AuthSplitPage } from "@/components/auth/auth-split-page";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "Sign Up",
  alternates: { canonical: "/signup" },
  robots: { index: false, follow: true },
}, { path: "/signup" });

const STEPS = [
  { title: "Enter your email", body: "Or continue with Google. No password needed to start." },
  { title: "Confirm it's you", body: "We email you a link so your account stays yours." },
  { title: "Save and compare", body: "Keep the homes you like and hear when prices or progress change." },
] as const;

export default function SignupPage() {
  return (
    <AuthSplitPage
      label="Create an account"
      headline="Find your home."
      sub="Create a free account to save listings, compare plans side by side and follow the developers you like."
      ctas={<>
        <Link href="/login" className="fdv-cta-final-button">Already have an account? Log in</Link>
        <Link href="/developers/register" className="fdv-cta-secondary fdv-hero-explore-link">Developer registration</Link>
      </>}
      below={<AuthBoxes title="How it works." lede="Free for buyers. Three quick steps." items={STEPS} />}
    >
      <PageAuthShell redirectTo="/account" variant="card" />
    </AuthSplitPage>
  );
}

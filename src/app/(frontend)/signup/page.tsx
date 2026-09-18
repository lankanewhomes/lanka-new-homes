import type { Metadata } from "next";
import Link from "next/link";
import { PageAuthShell } from "@/components/auth/page-auth-shell";

export const metadata: Metadata = {
  title: "Sign Up",
  alternates: { canonical: "/signup" },
  robots: { index: false, follow: true },
};

export default function SignupPage() {
  return (
    <div className="static-page-shell auth-page">
      <PageAuthShell redirectTo="/account" />

      <p className="static-page-note auth-page-note">
        Already have an account? <a href="/login">Log in</a>. Registering a development company?{" "}
        <Link href="/developers/register">Developer registration</Link>.
      </p>
    </div>
  );
}

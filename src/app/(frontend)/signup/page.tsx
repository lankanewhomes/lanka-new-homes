import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign Up",
  alternates: { canonical: "/signup" },
  robots: { index: false, follow: true },
};

export default function SignupPage() {
  return (
    <div className="static-page-shell">
      <h1>Sign up</h1>
      <p className="static-page-lede">Save your favorite listings and get updates when new projects match what you&apos;re looking for.</p>

      <AuthForm mode="signup" redirectTo="/account" />

      <p className="static-page-note">
        Already have an account? <a href="/login">Log in</a>. Registering a development company?{" "}
        <Link href="/developers/register">Developer registration</Link>.
      </p>
    </div>
  );
}

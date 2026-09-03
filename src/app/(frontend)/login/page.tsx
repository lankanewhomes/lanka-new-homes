import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Log In",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <div className="static-page-shell developer-login-page">
      <h1>Log in</h1>
      <p className="static-page-lede developer-login-lede">Sign in to see your saved listings and inquiries.</p>

      <AuthForm mode="login" redirectTo="/account" />

      <p className="static-page-note developer-login-note">
        Don&apos;t have an account? <a href="/signup">Sign up</a>. Registered as a developer?{" "}
        <Link href="/developers/login">Developer login</Link>.
      </p>
    </div>
  );
}

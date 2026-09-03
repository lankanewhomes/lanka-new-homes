import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Developer Login",
  alternates: { canonical: "/developers/login" },
  robots: { index: false, follow: true },
};

export default function DeveloperLoginPage() {
  return (
    <div className="static-page-shell developer-login-page">
      <h1 className="developer-login-heading">Developer login</h1>
      <p className="static-page-lede developer-login-lede">Sign in to manage your projects, leads, and hero placements.</p>

      <AuthForm mode="login" intent="developer" redirectTo="/developers/dashboard" onDeveloperRoleCheck />

      <p className="static-page-note developer-login-note">
        Don&apos;t have a developer account yet? <Link href="/developers/register">Register your company</Link>.
      </p>
    </div>
  );
}

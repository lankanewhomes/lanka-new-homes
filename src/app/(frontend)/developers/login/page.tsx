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
    <div className="static-page-shell auth-page">
      <h1>Developer login</h1>
      <p className="static-page-lede auth-page-lede">Sign in to manage your projects, leads, and hero placements.</p>

      <AuthForm mode="login" intent="developer" redirectTo="/account" onDeveloperRoleCheck />

      <p className="static-page-note auth-page-note">
        Don&apos;t have a developer account yet? <Link href="/developers/register">Register your company</Link>.
      </p>
    </div>
  );
}

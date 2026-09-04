import type { Metadata } from "next";
import { PayloadLoginForm } from "@/components/auth/payload-login-form";

export const metadata: Metadata = {
  title: "Developer Login",
  alternates: { canonical: "/developers/login" },
  robots: { index: false, follow: true },
};

// Same look as the buyer /login page — email/password on top, social
// buttons below — but authenticates against Payload (see
// PayloadLoginForm) and lands in /cms, scoped to this developer's own
// projects/leads/analytics.
export default function DeveloperLoginPage() {
  return (
    <div className="static-page-shell auth-page payload-auth-page">
      <h1>Developer login</h1>
      <p className="static-page-lede auth-page-lede">Sign in to manage your projects, leads, and analytics.</p>

      <PayloadLoginForm />
    </div>
  );
}

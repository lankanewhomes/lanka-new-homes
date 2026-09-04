import type { Metadata } from "next";
import { PayloadLoginForm } from "@/components/auth/payload-login-form";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

// Same PayloadLoginForm as /developers/login — same look, same backend
// (Payload). An admin account just sees the full, unscoped /cms after
// logging in instead of a developer's restricted view.
export default function AdminLoginPage() {
  return (
    <div className="static-page-shell auth-page">
      <h1>Admin login</h1>
      <p className="static-page-lede auth-page-lede">Sign in to manage the site.</p>

      <PayloadLoginForm />
    </div>
  );
}

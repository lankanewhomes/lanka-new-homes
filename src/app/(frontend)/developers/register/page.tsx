import type { Metadata } from "next";
import Link from "next/link";
import { PayloadLoginForm } from "@/components/auth/payload-login-form";

export const metadata: Metadata = {
  title: "Developer Registration",
  description: "Register your development company on LankaNewHomes and publish your project listings.",
  alternates: { canonical: "/developers/register" },
};

// Same look as the buyer /signup page — one submission creates the Payload
// account and the linked company profile together (see PayloadLoginForm's
// signup mode), then lands in /cms. The company profile starts pending —
// see Developers.ts's beforeChange hook — an admin approves it from there.
export default function DeveloperRegisterPage() {
  return (
    <div className="static-page-shell auth-page payload-auth-page">
      <h1>Register as a developer</h1>
      <p className="static-page-lede auth-page-lede">
        Create your account and company profile in one step. Your listing dashboard is at /cms once you&apos;re in.
      </p>

      <PayloadLoginForm mode="signup" />

      <p className="static-page-note auth-page-note">
        Already have a developer account? <Link href="/developers/login">Log in</Link> instead.
      </p>
    </div>
  );
}

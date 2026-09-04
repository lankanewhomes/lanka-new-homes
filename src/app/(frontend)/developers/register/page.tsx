import type { Metadata } from "next";
import Link from "next/link";
import { PayloadLoginForm } from "@/components/auth/payload-login-form";

export const metadata: Metadata = {
  title: "Developer Registration",
  description: "Register your development company on LankaNewHomes and publish your project listings.",
  alternates: { canonical: "/developers/register" },
};

// Same look as the buyer /signup page — one submission creates the Payload
// account (Users.ts's afterChange hook creates the linked company profile
// server-side once the account exists — see PayloadLoginForm's signup
// mode). Confirm-your-email is required before logging in (Users.ts's
// auth.verify), so this no longer lands straight in /cms — the form shows
// a "check your email" message instead. The company profile starts
// pending — an admin approves it from /cms.
export default function DeveloperRegisterPage() {
  return (
    <div className="static-page-shell auth-page payload-auth-page">
      <h1>Register as a developer</h1>
      <p className="static-page-lede auth-page-lede">
        Create your account and company profile in one step. Confirm your email, then your listing dashboard is at /cms.
      </p>

      <PayloadLoginForm mode="signup" />

      <p className="static-page-note auth-page-note">
        Already have a developer account? <Link href="/developers/login">Log in</Link> instead.
      </p>
    </div>
  );
}

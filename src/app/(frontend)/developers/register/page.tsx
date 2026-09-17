import type { Metadata } from "next";
import Link from "next/link";
import { PayloadLoginForm } from "@/components/auth/payload-login-form";
import { FacebookFinishSignupForm } from "@/components/auth/facebook-finish-signup-form";

export const metadata: Metadata = {
  title: "Developer Registration",
  description: "Register your development company on LankaNewHomes and publish your project listings.",
  alternates: { canonical: "/developers/register" },
};

type DeveloperRegisterPageProps = {
  searchParams: Promise<{ fb_pending?: string; fb_name?: string }>;
};

// Same look as the buyer /signup page — one submission creates the Payload
// account (Users.ts's afterChange hook creates the linked company profile
// server-side once the account exists — see PayloadLoginForm's signup
// mode). Confirm-your-email is required before logging in (Users.ts's
// auth.verify), so this no longer lands straight in /cms — the form shows
// a "check your email" message instead. The company profile starts
// pending — an admin approves it from /cms.
//
// A Facebook signup skips the password/email-confirmation dance entirely
// (Facebook already proved the email) but still needs one field the normal
// form collects that Facebook doesn't give us — see
// /api/auth/admin-facebook/callback/route.ts. `fb_pending=1` means someone
// just came back from that flow and only needs to supply a company name.
export default async function DeveloperRegisterPage({ searchParams }: DeveloperRegisterPageProps) {
  const { fb_pending, fb_name } = await searchParams;

  return (
    <div className="static-page-shell auth-page payload-auth-page">
      <h1>Register as a developer</h1>
      <p className="static-page-lede auth-page-lede">
        Create your account and company profile in one step. Confirm your email, then your listing dashboard is at /cms.
      </p>

      {fb_pending === "1" ? <FacebookFinishSignupForm name={fb_name ?? ""} /> : <PayloadLoginForm mode="signup" />}

      <p className="static-page-note auth-page-note">
        Already have a developer account? <Link href="/developers/login">Log in</Link> instead.
      </p>
    </div>
  );
}

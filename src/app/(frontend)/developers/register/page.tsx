import type { Metadata } from "next";
import Link from "next/link";
import { PayloadLoginForm } from "@/components/auth/payload-login-form";
import { FacebookFinishSignupForm } from "@/components/auth/facebook-finish-signup-form";
import { ScrollReveal } from "@/components/marketplace/scroll-reveal";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "Developer Registration",
  description: "Register your development company on LankaNewHomes and publish your project listings.",
  alternates: { canonical: "/developers/register" },
}, { path: "/developers/register" });

const STEPS = [
  { title: "Create your account", body: "Your account and company profile are created in one step." },
  { title: "Confirm your email", body: "A confirmation link comes to your inbox before you can log in." },
  { title: "We review your profile", body: "A new company profile starts pending until our team approves it." },
  { title: "Publish your listings", body: "Add projects, plans and pricing from your dashboard at /cms." },
] as const;

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
    <div className="fdv-page wdx-page login-page">
      <ScrollReveal />

      <section className="fdv-hero fdv-hero--split" aria-label="Register as a developer">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">List your project.</h1>
            <p className="fdv-hero-sub">
              Create your account and company profile in one step. Confirm your email, then your listing dashboard is at /cms.
            </p>
            <div className="fdv-hero-ctas">
              <Link href="/developers/login" className="fdv-cta-final-button">Already registered? Log in</Link>
              <Link href="/for-developers" className="fdv-cta-secondary fdv-hero-explore-link">Why list with us</Link>
            </div>
          </div>

          <div className="login-card auth-page">
            {fb_pending === "1" ? <FacebookFinishSignupForm name={fb_name ?? ""} /> : <PayloadLoginForm mode="signup" />}
          </div>
        </div>
      </section>

      <section className="fdv-box fdv-box--cream" aria-label="How registration works">
        <div className="wdx-section-head" data-reveal>
          <h2>How it works.</h2>
          <p>Four steps from sign-up to a live listing.</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--3" data-reveal>
          {STEPS.map((step, index) => (
            <div key={step.title} className="fdv-box-card">
              <span className="login-step-number" aria-hidden="true">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

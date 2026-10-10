import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, FolderKanban, Inbox } from "lucide-react";
import { PayloadLoginForm } from "@/components/auth/payload-login-form";
import { ScrollReveal } from "@/components/marketplace/scroll-reveal";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "Developer Login",
  alternates: { canonical: "/developers/login" },
  robots: { index: false, follow: true },
}, { path: "/developers/login" });

// Redesigned 2026-10-03 like /login and /web-design (owner request). Authenticates against Payload (see
// PayloadLoginForm) and lands in /cms, scoped to this developer's own projects/leads/analytics.
const PERKS = [
  { icon: FolderKanban, title: "Your projects", body: "Edit your listings, floor plans, pricing and construction updates." },
  { icon: Inbox, title: "Your leads", body: "See the enquiries buyers send about your projects." },
  { icon: BarChart3, title: "Your analytics", body: "Track views and enquiries for each listing." },
] as const;

export default function DeveloperLoginPage() {
  return (
    <div className="fdv-page wdx-page login-page">
      <ScrollReveal />

      <section className="fdv-hero fdv-hero--split" aria-label="Developer login">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">Developer login.</h1>
            <p className="fdv-hero-sub">Sign in to manage your projects, leads and analytics.</p>
            <div className="fdv-hero-ctas">
              <Link href="/developers/register" className="fdv-cta-final-button">Register as a developer</Link>
              <Link href="/login" className="fdv-cta-secondary fdv-hero-explore-link">Buyer login</Link>
            </div>
          </div>

          <div className="login-card auth-page">
            <PayloadLoginForm />
          </div>
        </div>
      </section>

      <section className="fdv-box fdv-box--cream" aria-label="Your dashboard">
        <div className="wdx-section-head" data-reveal>
          <h2>Your dashboard.</h2>
          <p>Everything for your listings in one place.</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--3" data-reveal>
          {PERKS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="fdv-box-card">
              <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

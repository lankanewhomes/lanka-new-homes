import type { Metadata } from "next";
import Link from "next/link";
import { Bell, GitCompareArrows, Heart } from "lucide-react";
import { PageAuthShell } from "@/components/auth/page-auth-shell";
import { ScrollReveal } from "@/components/marketplace/scroll-reveal";

export const metadata: Metadata = {
  title: "Log In",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

// Owner, 2026-10-03: "redesign this [login] like the web-design page" — same hero + contained boxes system as
// /web-design (docs/design.md "Page section style: contained boxes"). The form itself (AuthForm) is unchanged.
// `?next=` (set when a visitor is sent here from a listing) is honoured only for same-site paths.
function safeNext(next: string | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/account";
}

const PERKS = [
  { icon: Heart, title: "Save the homes you like", body: "Keep listings in one place and come back to them from any device." },
  { icon: GitCompareArrows, title: "Compare side by side", body: "Line up prices, plans and facilities before you decide." },
  { icon: Bell, title: "Hear about changes", body: "Follow a developer and get an email when pricing or construction updates change." },
] as const;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <div className="fdv-page wdx-page login-page">
      <ScrollReveal />

      <section className="fdv-hero fdv-hero--split" aria-label="Log in">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">Welcome back.</h1>
            <p className="fdv-hero-sub">
              Log in to pick up where you left off: your saved homes, enquiries and updates are waiting for you.
            </p>
            <div className="fdv-hero-ctas">
              <Link href="/signup" className="fdv-cta-final-button">Create an account</Link>
              <Link href="/developers/login" className="fdv-cta-secondary fdv-hero-explore-link">Developer login</Link>
            </div>
          </div>

          <div className="login-card auth-page">
            <PageAuthShell redirectTo={safeNext(next)} variant="card" />
          </div>
        </div>
      </section>

      <section className="fdv-box fdv-box--cream" aria-label="What your account gives you">
        <div className="wdx-section-head" data-reveal>
          <h2>What an account gives you.</h2>
          <p>Free for buyers. Log in with your email or Google.</p>
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

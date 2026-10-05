import type { Metadata } from "next";
import { VerifyDomainConfirm } from "./confirm-client";

export const metadata: Metadata = {
  title: "Confirm your company email",
  robots: { index: false, follow: false },
};

export default async function VerifyDomainPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="fdv-page wdx-page login-page">
      <section className="fdv-hero fdv-hero--split" aria-label="Confirm your company email">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">Verified Developer.</h1>
            <p className="fdv-hero-sub">Confirm your company email to add the Verified Developer badge to your profile.</p>
          </div>
          <div className="login-card auth-page">
            <VerifyDomainConfirm token={token ?? ""} />
          </div>
        </div>
      </section>
    </div>
  );
}

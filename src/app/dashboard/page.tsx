import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Dashboard",
  alternates: { canonical: "/dashboard" },
  robots: { index: false, follow: true },
};

export default function ConsumerDashboardPage() {
  return (
    <div className="static-page-shell">
      <h1>Your dashboard</h1>
      <p className="static-page-lede">Sign in to see your saved listings and the developers you&apos;ve requested information from.</p>
      <p className="static-page-note"><a href="/login">Log in</a> or <a href="/signup">create an account</a> to get started.</p>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  alternates: { canonical: "/terms" },
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <div className="static-page-shell">
      <h1>Terms of Service</h1>
      <p className="static-page-lede">By using NewHomesSrilanka, you agree to the following terms.</p>

      <h2>Using the platform</h2>
      <p>NewHomesSrilanka lists new construction projects on behalf of developers. We do not own, develop, or sell the properties listed on this site &mdash; all transactions happen directly between buyers and the listed developer.</p>

      <h2>Developer accounts</h2>
      <p>Developers are responsible for the accuracy of the project information, pricing, and imagery they submit.</p>

      <h2>Contact</h2>
      <p>Questions about these terms can be sent to <a href="mailto:legal@lankaliving.lk">legal@lankaliving.lk</a>.</p>
    </div>
  );
}

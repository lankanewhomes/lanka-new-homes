import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="static-page-shell">
      <h1>Privacy Policy</h1>
      <p className="static-page-lede">This page describes how LankaLiving collects, uses, and protects your information.</p>

      <h2>Information we collect</h2>
      <p>When you request information about a listing, save a project, or register as a developer, we collect the details you provide, such as your name, email, and phone number.</p>

      <h2>How we use it</h2>
      <p>We use your information to respond to inquiries, connect you with developers and their sales teams, and improve the platform.</p>

      <h2>Contact</h2>
      <p>Questions about this policy can be sent to <a href="mailto:privacy@lankaliving.lk">privacy@lankaliving.lk</a>.</p>
    </div>
  );
}

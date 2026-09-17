import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="static-page-shell">
      <h1>Privacy Policy</h1>
      <p className="static-page-lede">This page describes how LankaNewHomes collects, uses, and protects your information when you use our marketplace for new homes, developments, and land projects in Sri Lanka.</p>

      <h2>Information we collect</h2>
      <p>We collect information you provide directly, including:</p>
      <ul>
        <li>Your name, email address, and phone number when you request information about a listing, save a project, or contact a developer.</li>
        <li>Your name, email, password, and company details when you register a buyer or developer account.</li>
        <li>Basic profile information (name, email, profile photo) when you sign in with Google, Facebook, or LinkedIn instead of creating a password.</li>
        <li>Project, pricing, and media details submitted by developers when they list a property.</li>
      </ul>
      <p>We also collect some information automatically:</p>
      <ul>
        <li>Usage data such as pages viewed, listings saved, and search activity, via Google Analytics and Google Tag Manager — see our <Link href="/cookies">Cookie Policy</Link> for details.</li>
        <li>Standard technical information (IP address, browser type, device type) recorded by our hosting provider for security and performance.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To connect buyer inquiries with the relevant developer or sales team, and route lead alerts to them by email and (where enabled) WhatsApp.</li>
        <li>To create and manage your account, including signing you in via Google, Facebook, or LinkedIn.</li>
        <li>To send transactional emails — account confirmation, password resets, and lead notifications — through our email provider, Resend.</li>
        <li>To understand how the site is used so we can improve it, using aggregated analytics from Google Analytics.</li>
        <li>To detect and prevent fraud, spam, and misuse of the platform.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>We share buyer inquiry details (name, contact information, and message) with the specific developer or sales team a buyer contacts — that is the core purpose of the platform. We do not sell your personal information to third parties. We use the following service providers to operate the site, each of which processes data on our behalf:</p>
      <ul>
        <li><strong>Google</strong> — sign-in (OAuth), Analytics, and Tag Manager.</li>
        <li><strong>Meta (Facebook)</strong> and <strong>LinkedIn</strong> — sign-in (OAuth), where enabled.</li>
        <li><strong>Resend</strong> — delivery of transactional email.</li>
        <li><strong>Supabase</strong> and <strong>Cloudflare</strong> — database hosting and media storage.</li>
        <li><strong>Vercel</strong> — application hosting.</li>
      </ul>

      <h2>Data retention</h2>
      <p>We keep account and lead information for as long as your account is active or as needed to provide the service, respond to inquiries, and meet legal or accounting obligations. You can ask us to delete your account and associated personal data at any time (see Your rights below).</p>

      <h2>Your rights</h2>
      <p>You can request access to, correction of, or deletion of your personal information by emailing <a href="mailto:support@lankanewhomes.com">support@lankanewhomes.com</a>. You can also update most account details yourself after signing in, and unsubscribe from email alerts using the link in any email we send.</p>

      <h2>Children</h2>
      <p>LankaNewHomes is intended for adults searching for or listing property. We do not knowingly collect information from children.</p>

      <h2>Changes to this policy</h2>
      <p>We may update this policy as the platform evolves. Material changes will be reflected by an updated date on this page.</p>

      <h2>Contact</h2>
      <p>Questions about this policy can be sent to <a href="mailto:support@lankanewhomes.com">support@lankanewhomes.com</a>.</p>
    </div>
  );
}
